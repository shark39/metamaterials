'use strict';

const _              = require('lodash');
const StlReader      = require('stl-reader');
const THREE          = require('three');
const voxelize       = require('voxelize');
const CSG            = require('openjscad-csg').CSG;
const saveAs         = require('file-saver').saveAs;

const STLExporter    = require('../misc/STLExporter');
const OBJExporter    = require('../misc/OBJExporter');
const OBJLoader2     = require('../misc/OBJLoader');

const VoxelBuilder   = require("./voxelBuilder");

module.exports = (function() {

  function VoxelGrid(scene, size, settings) {
    this.scene = scene;
    this.size = size;
    this.settings = settings;

    this.minThickness = 0.01;

    this.textureGeometry = new THREE.Geometry();

    this.intersectionVoxelGeometry = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    this.anchorGeometry = new THREE.SphereGeometry(0.35, 0.35, 0.35);
    this.anchorMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    this.anchorParent = new THREE.Object3D();
    this.anchorParent.visible = false;
    this.scene.add(this.anchorParent);

    this.voxelGroup = new THREE.Object3D();
    this.scene.add(this.voxelGroup);
    
    this.reset();
  }

  VoxelGrid.prototype.reset = function() {

    this.voxels = {};
    this.badVoxels = {};
    this.anchors = {};

    this.intersectionVoxels = {};
    this.intersectionVoxels.plane = this.intersectionPlane();

    this.scene.remove(this.voxelGroup);
    this.voxelGroup = new THREE.Object3D();
    this.scene.add(this.voxelGroup);

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

  VoxelGrid.prototype.exportObj = function() {
    var exporter = new THREE.OBJExporter();
    var geometry = new THREE.Geometry();
    var voxels = _.uniq(Object.values(this.voxels));
    for (var vox of voxels) {
      let geo = vox.getGeometry().clone();
      geo.translate(vox.position.x, vox.position.y, vox.position.z);
      geometry.merge(geo);
    }

    var objString = exporter.parse(geometry);
    var blob = new Blob([objString], {type: 'text/plain'});
    return blob
  };

  VoxelGrid.prototype.exportJson = function() {
    var voxels = _.uniq(Object.values(this.voxels));
    var voxelJsons = voxels.map((voxel) => voxel.json());
    var blob = new Blob([JSON.stringify(voxelJsons, null, 2)], {type: 'text/plain'});
    return blob
  };

  VoxelGrid.prototype.importJson = function(json) {
    let voxels = JSON.parse(json);
    this.reset();
    for (var voxel of voxels) {
      voxel.options.orientation = toVector(voxel.options.orientation);
      voxel.position = toVector(voxel.position);
      this.addVoxel(new VoxelBuilder(voxel.position, voxel.type, voxel.options), voxel.position);
    }

    function toVector(obj) {
      return new THREE.Vector3(obj.x, obj.y, obj.z);
    }
  };

  VoxelGrid.prototype.update = function() {
  };

  VoxelGrid.prototype.intersectionPlane = function() {
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(this.size.x, this.size.z));
    plane.rotation.x = -Math.PI / 2.0;
    plane.isPlane = true;
    plane.updateMatrixWorld(true);
    return plane;
  };

  VoxelGrid.prototype.addVoxel = function(voxel, position) {
    var size = voxel.size();
    var origin = voxel.position;
    for(var x = 0; x < size[0]; x++)
      for(var y = 0; y < size[1]; y++)
        for(var z = 0; z < size[2]; z++){
          let pos = [origin.x + x, origin.y + y, origin.z + z];
          this.removeVoxel(pos, voxel);
    }
    for(var x = 0; x < size[0]; x++)
      for(var y = 0; y < size[1]; y++)
        for(var z = 0; z < size[2]; z++){
          let pos = [origin.x + x, origin.y + y, origin.z + z];
          this.addIntersectionVoxel(pos, voxel);
          this.voxels[pos] = voxel;
    }
    var mesh = voxel.getMesh();
    mesh.position.copy(position);
    //mesh.matrixAutoUpdate  = false;
    //mesh.updateMatrix();
    this.voxelGroup.add(mesh);
    return voxel;
  };

  VoxelGrid.prototype.removeVoxel = function(position, exclude) {
    position = position instanceof Array ? position : position.toArray();
    var voxel = this.voxels[position];
    if(!voxel || voxel == exclude) return;

    var origin = voxel.position;
    this.voxelsHaveChanged = true;

    var size = voxel.size();
    for(var x = 0; x < size[0]; x++)
      for(var y = 0; y < size[1]; y++)
        for(var z = 0; z < size[2]; z++){
          let pos = [origin.x + x, origin.y + y, origin.z + z];
          if(!this.voxels[pos]) return;
          this.removeIntersectionVoxel(pos);
          if(!this.voxels[pos].meshRemoved){
            this.voxelGroup.remove(this.voxels[pos].mesh);
            this.voxels[pos].meshRemoved = true;
          }
          delete this.voxels[pos];
        }
    return voxel;
  };

  VoxelGrid.prototype.voxelAtPosition = function(position) {
    return this.voxels[position.toArray()];
  };

  VoxelGrid.prototype.addIntersectionVoxel = function(position, voxel) {
    const mesh = new THREE.Mesh(this.intersectionVoxelGeometry);
    mesh.position.copy(new THREE.Vector3().fromArray(position));
    mesh.updateMatrixWorld(true);
    mesh.userData.voxel = voxel;
    this.intersectionVoxels[position] = mesh;
  };

  VoxelGrid.prototype.removeIntersectionVoxel = function(position) {
    delete this.intersectionVoxels[position];
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

  VoxelGrid.prototype.isFreeAtPosition = function( position ) {
        return typeof this.voxelAtPosition( position ) === 'undefined';
  };

  VoxelGrid.prototype.setMinThickness = function(minThickness) {
    if(this.minThickness === minThickness) return;
    this.minThickness = minThickness;
    for(let voxel in this.voxels) {
      voxel = this.voxels[voxel];
      let mesh = voxel.mesh;
      voxel.setMinThickness(minThickness);
      if(mesh !== voxel.mesh) {
        voxel.mesh.position.copy(voxel.position);
        this.voxelGroup.add(voxel.mesh);
        this.voxelGroup.remove(mesh);
      }
    }
  }

  return VoxelGrid;
})();

Array.prototype.diff = function(a) {
  return this.filter(function(i) {return a.indexOf(i) < 0;});
};
