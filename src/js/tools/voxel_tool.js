'use strict';

const bind = require('../misc/bind');
const Cursor = require('../misc/cursor');
const Tool = require('./tool');

const Texture = require('../geometry/textureCell/texture');
const TextureSupport = require('../geometry/textureCell/textureSupport');
// const addBorderingIfNeeded = require('./bordering');
const MechanicalCell = require('../geometry/mechanicalCell/mechanicalCell');


const $ = require('jquery');
const _ = require('lodash');
const THREE = require('three');

module.exports = (function() {

  function VoxelTool(renderer, voxelGrid) {
    Tool.call(this, renderer);

    this.voxelGrid = voxelGrid;
    this.startPosition = new THREE.Vector3();
    this.endPosition = new THREE.Vector3();
    this.lastPosition = {
      "start": new THREE.Vector3(),
      "end": new THREE.Vector3()
    }; //save the latest position to avoid unecessary updates

    this.extrusionNormal = new THREE.Vector3();
    this.extrusionComponent = 0;

    this.allowCube = true;
    this.cursorBorder = 0.0;
    this.stiffness = {
      from: 0.01,
      to: 0.01
    };

    this.minPosition = new THREE.Vector3(-(this.voxelGrid.size.x / 2 - 0.5),
      0.5, -(this.voxelGrid.size.z / 2 - 0.5)
    );
    this.maxPosition = new THREE.Vector3(
      this.voxelGrid.size.x / 2 - 0.5,
      this.voxelGrid.size.y - 0.5,
      this.voxelGrid.size.z / 2 - 0.5
    );

    this.cursor = new Cursor();
    this.cursor.mesh.visible = false;
    this.scene.add(this.cursor.mesh);

    // this.setCuboidMode(false, false);
    this.setCuboidMode(true, false);

    this.mirror = [false, false, false];
  }

  VoxelTool.prototype = Object.create(Tool.prototype);

  VoxelTool.prototype.setMirrorMode = function(mirrorMode) {
    this.mirror = [mirrorMode, false, false];
  }

  VoxelTool.prototype.setCuboidMode = function(cuboidMode) {
    this.cuboidMode = cuboidMode;

    if (this.cuboidMode) {
      this.mouseMoveUp = this.processSingle;
      this.mouseMoveDown = this.processRect;

      if (this.allowCube) {
        this.mouseUp = function() {
          this.processRect();
          this.savedEndPosition = this.endPosition.clone();
          this.mouseMoveUp = this.processCube;
          this.mouseMoveDown = this.processCube;
          this.mouseUp = this.updateVoxelGrid;
        }.bind(this);
      } else {
        this.mouseUp = this.updateVoxelGrid;
      }
    } else {
      this.mouseMoveUp = this.processSingle;
      this.mouseMoveDown = null;
      this.mouseUp = this.updateVoxelGrid;
    }

    this.processSingle();
  }

  VoxelTool.prototype.processSingle = function() {
    const intersectionVoxels = _.values(this.voxelGrid.intersectionVoxels);
    const intersection = this.raycaster.intersectObjects(intersectionVoxels)[0];

    if (!intersection) {
      return;
    }

    _.extend(this, this.extrusionParametersFromIntersection(intersection));
    this.extrusionComponent = this.extrusionNormal.largestComponent();

    if (this.rotatedMode && this.startPosition) {
      this.startPosition.addScalar(0.5);
      this.startPosition.setComponent(this.extrusionComponent, this.startPosition.getComponent(this.extrusionComponent) - 0.5);
    }

    this.endPosition = this.startPosition;
    this.updateSelection();
  }

  VoxelTool.prototype.processRect = function() {
    if (!this.startPosition) {
      return;
    }

    const planeOffset = -this.startPosition.getComponent(this.extrusionComponent) * this.extrusionNormal.getComponent(this.extrusionComponent);
    const plane = new THREE.Plane(this.extrusionNormal, planeOffset);
    const intersection = this.raycaster.ray.intersectPlane(plane);

    if (intersection) {
      if (this.rotatedMode) {
        this.endPosition = intersection.clone().sub(this.startPosition).divideScalar(2.0).ceil().multiplyScalar(2.0);
        const rectDirection = this.endPosition.largestComponent();
        this.endPosition.setComponent((rectDirection + 1) % 3, 0.0);
        this.endPosition.setComponent((rectDirection + 2) % 3, 0.0);
        this.endPosition.add(this.startPosition);
      } else {
        this.endPosition = intersection.clone().sub(this.startPosition).round().add(this.startPosition);
      }
      this.updateSelection();
    }
  }

  VoxelTool.prototype.processCube = function() {
    const normal = this.extrusionNormal.clone().cross(this.raycaster.ray.direction);
    const intersectionNormal = normal.cross(this.raycaster.ray.direction);
    const intersection = this.raycaster.ray.origin.clone().sub(this.savedEndPosition).dot(intersectionNormal) / this.extrusionNormal.clone().dot(intersectionNormal);

    const extrusionLength = this.extrusionLengthFromIntersection(intersection) * this.extrusionNormal.getComponent(this.extrusionComponent);
    this.endPosition.setComponent(this.extrusionComponent, this.savedEndPosition.getComponent(this.extrusionComponent) + extrusionLength);
    this.updateSelection();
  }

  VoxelTool.prototype.updateSelection = function() {

    if (!this.startPosition || !this.endPosition) {
      this.cursor.visible = false;
      this.infoBox.hide();
      return;
    }

    if (this.cuboidMode) {
      this.infoBox.show();
    } else {
      this.infoBox.hide();
    }

    this.startPosition.clamp(this.minPosition, this.maxPosition);
    this.endPosition.clamp(this.minPosition, this.maxPosition);

    const start = this.startPosition.clone().min(this.endPosition);
    const end = this.startPosition.clone().max(this.endPosition);
    if (this.lastPosition.start.clone().sub(start).lengthSq() != 0 ||
    this.lastPosition.end.clone().sub(end).lengthSq() != 0 ) {
      this.renderSelectionShader();
      this.lastPosition.start = start.clone();
      this.lastPosition.end = end.clone();
    }

  }

  VoxelTool.prototype.renderSelectionShader = function() {
    const start = this.startPosition.clone().min(this.endPosition);
    const end = this.startPosition.clone().max(this.endPosition);

    this.cursor.mesh.visible = true;

    if (this.cuboidMode) {
      this.infoBox.show();
    } else {
      this.infoBox.hide();
    }

    if (this.rotatedMode) {
      this.cursor.mesh.position.copy(start.clone().add(end).divideScalar(2.0));

      const height = 1.0 + end.getComponent(this.extrusionComponent) - start.getComponent(this.extrusionComponent);
      start.setComponent(this.extrusionComponent, 0.0);
      end.setComponent(this.extrusionComponent, 0.0);
      const rotatedScale = (2.0 + start.distanceTo(end));
      const scale = rotatedScale / Math.sqrt(2.0);
      this.cursor.mesh.scale.setComponent(this.extrusionComponent, height + this.cursorBorder);
      this.cursor.mesh.scale.setComponent((this.extrusionComponent + 1) % 3, scale + this.cursorBorder);
      this.cursor.mesh.scale.setComponent((this.extrusionComponent + 2) % 3, scale + this.cursorBorder);

      const rotation = [0.0, 0.0, 0.0];
      rotation[this.extrusionComponent] = 45.0 / 180.0 * Math.PI;
      this.cursor.mesh.rotation.fromArray(rotation);

      this.cursor.mesh.material.uniforms.rotatedMode.value = 1;
      this.cursor.mesh.material.uniforms.rotatedScale.value = rotatedScale / 2.0;
      this.cursor.mesh.material.uniforms.rotatedHeight.value = height;
      this.cursor.mesh.material.uniforms.rotatedDirection.value = this.extrusionComponent;

      this.infoBox.html('size ' + [rotatedScale / 2, height, rotatedScale / 2].join(' x '));
    } else {
      this.cursor.mesh.position.copy(start.clone().add(end).divideScalar(2.0));
      this.cursor.mesh.scale.copy(end.clone().sub(start).addScalar(1.0 + this.cursorBorder));
      this.cursor.mesh.rotation.fromArray([0.0, 0.0, 0.0]);

      this.cursor.mesh.material.uniforms.scale.value.copy(this.cursor.mesh.scale);
      this.cursor.mesh.material.uniforms.rotatedMode.value = 0;
      this.cursor.mesh.material.uniforms.rotatedDirection.value = this.extrusionComponent;

      this.infoBox.html('size ' + this.cursor.mesh.scale.toArray().join(' x '));
    }

    this.updateCursor(); //implemented in voxel_edit_tool
  }

  VoxelTool.prototype.renderSelection = function() {
    console.log("render updateSelection");

    const start = this.startPosition.clone().min(this.endPosition);
    const end = this.startPosition.clone().max(this.endPosition);

    var cursorGeometry = new THREE.Geometry();
    var voxel;
    for (var x = start.x; x <= end.x;) {
      for (var y = start.y; y <= end.y;) {
        for (var z = start.z; z <= end.z;) {
          const position = new THREE.Vector3(x, y, z);
          const stiffness = 0.1;
          const offset = new THREE.Vector2(x - start.x, z - start.z);
          switch (this._activeBrush.type) {
            case "texture":
              var texture = new this.activeBrush.texture();
              if (texture.name.startsWith('custom')) {
                texture.canvasdrawer = this.activeBrush.canvasdrawer;
              }
              voxel = new Texture(position, texture, stiffness);
              break;
            default:
              const cellCoords = [offset.y % this._activeBrush.height, offset.x % this._activeBrush.width];
              const features = this._activeBrush.cells[cellCoords].features;
              voxel = new MechanicalCell(position, features, this.extrusionNormal.largestComponent(), stiffness, this.voxelGrid.minThickness);
          }
          var geo = voxel.getGeometry();

          geo.translate(offset.x, y - start.y, offset.y);
          cursorGeometry.merge(geo);

          z += voxel.size()[2];
        }
        y += voxel.size()[1];
      }
      x += voxel.size()[0];
    }

    this.cursor.mesh.visible = true;

    cursorGeometry.translate(-(end.x - start.x) / 2, -(end.y - start.y) / 2, -(end.z - start.z) / 2);
    this.cursor.setGeometry(cursorGeometry);
    this.cursor.mesh.position.copy(start.clone().add(end).divideScalar(2.0));

  }

  VoxelTool.prototype.updateCursor = function() {} //overwritten by inhertated functions


  VoxelTool.prototype.calculateStiffness = function(value, rangeStart, rangeEnd) {

    function normal() {
      return this.stiffness.from;
    }

    function alternating(value, rangeStart) {
      return (rangeStart - value) % 2 == 0 ? this.stiffness.from : this.stiffness.to;
    }

    function gradient(value, rangeStart, rangeEnd) {
      let r1 = [rangeStart, rangeEnd];
      let r2 = [this.stiffness.from, this.stiffness.to];
      if (r2[0] == r2[1]) return r2[0];
      return (value - r1[0]) * (r2[1] - r2[0]) / (r1[1] - r1[0]) + r2[0];
    }

    let calculateFunction = ({
      normal,
      gradient,
      alternating
    })[this.stiffness.pattern || 'normal'];
    return calculateFunction.bind(this)(value, rangeStart, rangeEnd);
  }

  VoxelTool.prototype.updateVoxelGrid = function() {
    if (!this.startPosition || !this.endPosition || !this.cuboidMode && this.hasMoved) {
      this.processSingle();
      return;
    }

    const start = this.startPosition.clone().min(this.endPosition);
    const end = this.startPosition.clone().max(this.endPosition);

    var updatedVoxels = [];

    if (this.rotatedMode) {
      const h = this.extrusionComponent;
      const u = (h + 1) % 3;
      const v = (h + 2) % 3;
      const radius = Math.abs(start.getComponent(u) + start.getComponent(v) - end.getComponent(u) - end.getComponent(v)) / 2.0 + 1.0;
      const height = end.getComponent(h) - start.getComponent(h) + 1.0;
      const center = start.clone().add(end).divideScalar(2.0);

      for (var du = 0; du < radius * 2; du++)
        for (var dv = 0; dv < radius * 2; dv++)
          for (var dh = 0; dh < height; dh++) {
            if (Math.abs(du - radius + 0.5) + Math.abs(dv - radius + 0.5) > radius) {
              continue;
            }

            const position = [0.0, 0.0, 0.0];
            position[u] = center.getComponent(u) - radius + 0.5 + du;
            position[v] = center.getComponent(v) - radius + 0.5 + dv;
            position[h] = start.getComponent(h) + dh;

            updatedVoxels = updatedVoxels.concat(
              this.updateSingleVoxel(new THREE.Vector3().fromArray(position), new THREE.Vector2(du + (radius + 1) % 2, dv))
            );
          }
    } else {
      let lc = end.clone().sub(start).largestComponent();
      for (var x = start.x; x <= end.x; x++)
        for (var y = start.y; y <= end.y; y++)
          for (var z = start.z; z <= end.z; z++) {
            var brushtexture = this.activeBrush.texture;
            if (this.activeBrush.type == "texture" && y < end.y) {
              this.activeBrush.texture = TextureSupport;
            }
            let stiffness = this.calculateStiffness([x, y, z][lc], start.getComponent(lc), end.getComponent(lc));
            updatedVoxels = updatedVoxels.concat(
              this.updateSingleVoxel(new THREE.Vector3(x, y, z), new THREE.Vector2(x - start.x, z - start.z), stiffness)
            );
            this.activeBrush.texture = brushtexture;
          }
    }

    this.voxelGrid.update();
    this.setCuboidMode(this.cuboidMode, this.rotatedMode);
    this.processSingle();
  }

  VoxelTool.prototype.updateSingleVoxel = function(position, offset, stiffness) {

    if (this.activeBrush.type == "texture") {
      return this.updateVoxel(position, null, stiffness);
    }
    const cellCoords = [offset.y % this.activeBrush.height, offset.x % this.activeBrush.width];
    const features = this.activeBrush.cells[cellCoords].features;
    return this.updateVoxel(position, features, stiffness);
  }

  VoxelTool.prototype.__defineGetter__('activeBrush', function() {
    return this._activeBrush;
  });

  VoxelTool.prototype.__defineSetter__('activeBrush', function(activeBrush) {
    this._activeBrush = activeBrush;

    if (activeBrush.type == 'texture') { //create the texture and update the cursor geometry
      var texture = new activeBrush.texture();
      //this.cursor.setGeometry(texture.getGeometry());

    } else {
      var geometry = new THREE.BoxGeometry(1.0, 1.0, 1.0);
      this.cursor.mesh.material.uniforms.image.value = new THREE.Texture(activeBrush.textureIcon);
      this.cursor.mesh.material.uniforms.image.value.needsUpdate = true;
      //this.cursor.setGeometry(geometry);
    }
  });

  VoxelTool.prototype.alterMouseEvents = function() {
    const oldouseMoveDown = this.mouseMoveDown;
    const oldouseDown = this.mouseDown;
    const oldouseUp = this.mouseUp;

    this.mouseMoveDown = this.alternativeMouseMoveDown;
    this.mouseDown = this.alternativeMouseDown;
    this.mouseUp = this.alternativeMouseUp;

    this.alternativeMouseMoveDown = oldouseMoveDown;
    this.alternativeMouseDown = oldouseDown;
    this.alternativeMouseUp = oldouseUp;
  }

  return VoxelTool;

})();
