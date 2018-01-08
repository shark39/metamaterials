'use strict';

const _              = require('lodash');
const StlReader      = require('stl-reader');
const THREE          = require('three');
const voxelize       = require('voxelize');
const CSG            = require('openjscad-csg').CSG;
const saveAs         = require('file-saver').saveAs;

const GeometryBuffer = require('./geometry_buffer');
const Voxel          = require('./mechanicalCell/voxel');
const STLExporter    = require('../misc/STLExporter');
const OBJExporter    = require('../misc/OBJExporter');
const OBJLoader2      = require('../misc/OBJLoader');

module.exports = (function() {

  function VoxelGrid(scene, size, settings) {
    this.scene = scene;
    this.size = size;
    this.settings = settings;

    this.buffer = new GeometryBuffer(scene, this.size, 100000);

    this.textureGeometry = new THREE.Geometry();

    this.intersectionVoxelGeometry = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    this.anchorGeometry = new THREE.SphereGeometry(0.35, 0.35, 0.35);
    this.anchorMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    this.anchorParent = new THREE.Object3D();
    this.anchorParent.visible = false;
    this.scene.add(this.anchorParent);

    this.reset();
  }

  VoxelGrid.prototype.reset = function() {
    this.buffer.reset();

    this.voxels = {};
    this.badVoxels = {};
    this.anchors = {};

    this.intersectionVoxels = {};
    this.intersectionVoxels.plane = this.intersectionPlane();

    this.anchorParent.children.forEach(function(child) {
      this.anchorParent.remove(child);
    }, this);
  };

  VoxelGrid.prototype.import = function(stlFile, voxelDimensions) {
    var reader = new StlReader();
    var stlData = reader.read(stlFile);

    var positions = _.chunk(stlData.vertices, 3);
    var cells = _.chunk(_.range(positions.length), 3);
    var voxels = voxelize(cells, positions, voxelDimensions).voxels;

    this.reset();

    var modelSize = new THREE.Vector3(voxels.shape[0], voxels.shape[2], voxels.shape[1]);
    var offset = new THREE.Vector3((-modelSize.x >> 1) + 0.5, -0.5, (-modelSize.z >> 1) + 0.5);
    var stride = new THREE.Vector3().fromArray(voxels.stride);

    voxels.data.forEach(function(voxel, index) {
      if (voxel == 0) { return; }
      var position = new THREE.Vector3(
        Math.floor((index % stride.y) / stride.x),
        Math.floor(index / stride.z),
        Math.floor((index % stride.z) / stride.y)
      ).add(offset);
      this.addVoxel(position, ['box'], 0, 1);
    }.bind(this));
    this.update();
  };

  VoxelGrid.prototype.export = function() {
    const elementGeometry = this.buffer.renderMesh.geometry;
    const vertices = elementGeometry.attributes.position.array;
    const indices = elementGeometry.index.array;

    var polygons  = [];
    var csgVertices = [];

    for(var k = 0; k < indices.length; k++){
      if(k > 0 && k % 3 == 0){
        polygons.push(new CSG.Polygon(csgVertices));
        csgVertices = [];
      }

      var index = indices[k] * 3;
      csgVertices.push(new CSG.Vertex(new CSG.Vector3D(
        vertices[index] * this.cellSize,
        vertices[index+1] * this.cellSize,
        vertices[index+2] * this.cellSize
      )));
    }

    polygons.push(new CSG.Polygon(csgVertices));

    const exportScene = CSG.fromPolygons(polygons);
    return exportScene;
  };

  VoxelGrid.prototype.addTexture = function(geometry) {
    THREE.GeometryUtils.merge(this.textureGeometry, geometry);
    //mark voxel in voxelgrid as full
  }

  VoxelGrid.prototype.exportTexture = function() {
    //debugger;
    var name = "export_texture";
    var exporter = new THREE.STLExporter();
    var stlString = exporter.parse( this.scene );

    var blob = new Blob([stlString], {type: 'text/plain'});

    saveAs(blob, name + '.stl');

  };

  VoxelGrid.prototype.exportObj = function() {
    //debugger;
    var name = "export";

    var objString = this.getTextureAsObj();
    var blob = new Blob([objString], {type: 'text/plain'});
    return blob
    

  };

  VoxelGrid.prototype.getTextureAsObj = function() {
    var exporter = new THREE.OBJExporter();
    //convert geometry to mesh
    //var material = new THREE.MeshPhongMaterial({color: 0xFF0000});
    //var mesh = new THREE.Mesh(this.textureGeometry, material);
    var objString = exporter.parse(this.textureGeometry);
    return objString;
  }

  VoxelGrid.prototype.setTextureFromObj = function(obj) {

    var loader = new THREE.OBJLoader2();
    var group = loader.parse(obj);
    var geo = group.children[0].geometry;
    this.textureGeometry = geo;
    var self = this;
    this.scene.traverse(function(object) {
      if (object.name == "texture") {
        self.scene.remove(object);
      }
    });
    var material = new THREE.MeshPhongMaterial({
				color: 0xa00000,
				flatShading: false
			});

    var mesh = new THREE.Mesh(geo, material);
    mesh.name = "texture";
    this.scene.add(mesh);

  }


  VoxelGrid.prototype.update = function() {
    this.buffer.update();
  };

  VoxelGrid.prototype.updateGridSettings = function(newThickness, newCellSize) {
    if(this.minThickness == newThickness && this.cellSize == newCellSize)
      return;

    this.minThickness = newThickness;
    this.cellSize = newCellSize;

    for (var key in this.voxels){
      const voxel = this.voxels[key];

      for(var i = 0; i < voxel.elements.length; i++) {
        var voxelElement = voxel.elements[i];

        voxelElement.updateThickness();
        voxelElement.updateRenderGeometry();
      }
    }

    this.update();
  };

  VoxelGrid.prototype.intersectionPlane = function() {
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(this.size.x, this.size.z));
    plane.rotation.x = -Math.PI / 2.0;
    plane.isPlane = true;
    plane.updateMatrixWorld(true);
    return plane;
  };

  VoxelGrid.prototype.addVoxel = function(position, features, direction, stiffness) {
    this.removeVoxel(position);
    this.voxelsHaveChanged = true;
    this.addIntersectionVoxel(position);

    return this.voxels[position.toArray()] = new Voxel(position, this, this.buffer, features, direction, stiffness);
  };

  VoxelGrid.prototype.removeVoxel = function(position) {
    if (this.voxels[position.toArray()]) {
      this.voxelsHaveChanged = true;
      this.removeIntersectionVoxel(position);
      this.voxels[position.toArray()].remove();
      delete this.voxels[position.toArray()];
    }
  };

  VoxelGrid.prototype.voxelAtPosition = function(position) {
    return this.voxels[position.toArray()];
  };

  VoxelGrid.prototype.addIntersectionVoxel = function(position) {
    const voxel = new THREE.Mesh(this.intersectionVoxelGeometry);
    voxel.position.copy(position);
    voxel.updateMatrixWorld(true);
    this.intersectionVoxels[position.toArray()] = voxel;
  };

  VoxelGrid.prototype.removeIntersectionVoxel = function(position) {
    delete this.intersectionVoxels[position.toArray()];
  };

  VoxelGrid.prototype.addAnchor = function(position) {
    if (!this.anchors[position.toArray()]) {
      this.anchorsHaveChanged = true;
      const anchor = new THREE.Mesh(this.anchorGeometry, this.anchorMaterial);
      anchor.position.copy(position);
      this.anchors[position.toArray()] = anchor;
      this.anchorParent.add(anchor);
    }
  };

  VoxelGrid.prototype.removeAnchor = function(position) {
    if (this.anchors[position.toArray()]) {
      this.anchorsHaveChanged = true;
      this.anchorParent.remove(this.anchors[position.toArray()]);
      delete this.anchors[position.toArray()];
    }
  };

  VoxelGrid.prototype.toggleAnchor = function(position) {
    if (this.anchors[position.toArray()]) {
      this.removeAnchor(position);
    } else {
      this.addAnchor(position);
    }
  };

  VoxelGrid.prototype.showAnchors = function() {
    this.anchorParent.visible = true;
  };

  VoxelGrid.prototype.hideAnchors = function() {
    this.anchorParent.visible = false;
  };

  VoxelGrid.prototype.vertices = function() {
    const rawVertices = _.flattenDeep(_.values(this.voxels).map(function(voxel) {
      return voxel.usedVertices();
    }));
    return _.uniqWith(rawVertices, function(a, b) { return a.equals(b); });
  };

  VoxelGrid.prototype.edges = function() {
    return _.flattenDeep(_.values(this.voxels).map(function(voxel) {
      return voxel.edges();
    }));
  };

  VoxelGrid.prototype.simulationData = function() {
    const mesh = this.voxelsHaveChanged ? this.meshForSimulation() : null;
    const anchors = this.anchorsHaveChanged ? this.anchorsForSimulation() : null;
    const textureObj = this.getTextureAsObj();

    this.voxelsHaveChanged = this.anchorsHaveChanged = false;

    return { mesh: mesh, anchors: anchors, textureObj: textureObj };
  };

  VoxelGrid.prototype.meshForSimulation = function() {
    /* vertices */
    const vertices = this.vertices();
    const vertexArray = [];

    const simulationIndices = {};

    vertices.forEach(function(vertex, index) {
      vertexArray.push(vertex.x, vertex.y, vertex.z);
      simulationIndices[vertex.toArray()] = index;
    }.bind(this));

    this.buffer.updateVertexIndices(vertices);

    /* edges */
    const edges = this.edges();
    const edgeArray = [];
    const stiffnessArray = [];
    const stiffnessMap = {};

    edges.forEach(function(edge) {
      const indices = [
        simulationIndices[edge.vertices[0].toArray()],
        simulationIndices[edge.vertices[1].toArray()]
      ];
      const hash = _.sortBy(indices);
      const edgeIndex = stiffnessMap[hash];

      if (edgeIndex == undefined) {
        stiffnessMap[hash] = edgeArray.length / 2;
        edgeArray.push(indices[0], indices[1]);
        stiffnessArray.push(edge.stiffness);
      } else {
        stiffnessArray[edgeIndex] = Math.max(stiffnessArray[edgeIndex], edge.stiffness);
      }
    });

    return { vertices: vertexArray, edges: edgeArray, stiffness: stiffnessArray };
  };

  VoxelGrid.prototype.anchorsForSimulation = function() {
    return _.flatten(_.values(this.anchors).map(function(anchor) {
      return anchor.position.toArray();
    }));
  };

  VoxelGrid.prototype.updateSimulation = function(vertices, simulatedForce) {
    this.buffer.updateVertices(vertices);
    this.buffer.startSimulation();
    this.buffer.simulatedForce = simulatedForce;
  };

  VoxelGrid.prototype.updateSimulationFromObj = function(obj) {
    this.setTextureFromObj(obj);

  }

  VoxelGrid.prototype.interpolateSimulation = function(force) {
    this.buffer.userForce = force;
  };

  VoxelGrid.prototype.stopSimulation = function() {
    this.buffer.stopSimulation();
  };

  VoxelGrid.prototype.isFreeAtPosition = function( position ) {
        return typeof this.voxelAtPosition( position ) === 'undefined';
  };


  VoxelGrid.prototype.highlightBadVoxels = function() {
    for (var key in this.badVoxels){
      this.badVoxels[key].markBad();
    }
  };

  return VoxelGrid;
})();

Array.prototype.diff = function(a) {
  return this.filter(function(i) {return a.indexOf(i) < 0;});
};
