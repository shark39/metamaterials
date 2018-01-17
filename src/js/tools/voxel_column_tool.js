'use strict';

const bind  = require('../misc/bind');
const VoxelTool  = require('./voxel_tool');
const MechanicalCell = require('../geometry/mechanicalCell/mechanicalCell');
const TextureCell = require('../geometry/textureCell/texture');

const THREE = require('three');

module.exports = (function() {

  function VoxelColumnTool(renderer, voxelGrid) {
    bind(this);
    VoxelTool.call(this, renderer, voxelGrid);

    this.cursor.material.uniforms.tool.value = 2;
    this.allowCube = false;

    this.setCuboidMode(true, false);
  }

  VoxelColumnTool.prototype = Object.create(VoxelTool.prototype);

  VoxelColumnTool.prototype.extrusionParametersFromIntersection = function(intersection) {
    return intersection.object.isPlane ? {
      startPosition: undefined
    } : {
      startPosition: intersection.object.position.clone(),
      extrusionNormal: intersection.face.normal.clone()
    }
  }

  VoxelColumnTool.prototype.extrusionLengthFromIntersection = function(intersection) {
    return 10;
  }

  VoxelColumnTool.prototype.updateSelection = function() {
    if (!this.startPosition || !this.endPosition) {
      this.cursor.visible = false;
      this.infoBox.hide();
      return;
    }

    this.startPosition.clamp(this.minPosition, this.maxPosition);
    this.endPosition.clamp(this.minPosition, this.maxPosition);

    var start = this.startPosition.clone().min(this.endPosition);
    var end = this.startPosition.clone().max(this.endPosition);


    this.cursor.visible = true;

    if (this.cuboidMode) {
      this.infoBox.show();
    } else {
      this.infoBox.hide();
    }

    var deltaY = 0;
    var pos = this.startPosition.clone();
    var pos2 = this.startPosition.clone();
    const voxels = this.voxelGrid.voxels;
    pos2.z --;

    while(voxels[pos.toArray()] && voxels[pos2.toArray()] && voxels[pos.toArray()].stiffness == voxels[pos2.toArray()].stiffness) {
      pos.z --;
      pos2.z --;
    }
    start = pos.clone();
    pos2.z += 2;
    while(voxels[pos.toArray()] && voxels[pos2.toArray()] && voxels[pos.toArray()].stiffness == voxels[pos2.toArray()].stiffness) {
      pos.z ++;
      pos2.z ++;
    }
    end = pos.clone();

    console.log(start, end);
    this.cursor.position.copy(start.clone().add(end).divideScalar(2.0));
    this.cursor.scale.copy(end.clone().sub(start).addScalar(1.0 + this.cursorBorder));
    this.cursor.rotation.fromArray([0.0, 0.0, 0.0]);

    this.cursor.material.uniforms.scale.value.copy(this.cursor.scale);
    this.cursor.material.uniforms.rotatedMode.value = 0;
    this.cursor.material.uniforms.rotatedDirection.value = this.extrusionComponent;

    if (this.activeBrush && this.activeBrush.type == 'texture') {
      if (this.activeBrush.rotated) {
        this.cursor.position.z += 0.5;
        this.cursor.scale.z *= 2;
        if (this.activeBrush.name.startsWith("custom")) {
          this.cursor.scale.x *= this.activeBrush.canvasdrawer.cellCount;
        }
      } else {
        this.cursor.position.x += 0.5;
        this.cursor.scale.x *= 2;
        if (this.activeBrush.name.startsWith("custom")) {
          this.cursor.scale.z *= this.activeBrush.canvasdrawer.cellCount;
        }
      }
    }

    this.updateCursor();
  }

  VoxelColumnTool.prototype.updateCursor = function() {
    this.cursor.scale.setComponent(this.extrusionComponent, 0.1);
    this.cursor.position.add(this.extrusionNormal.clone().multiplyScalar(0.7));
    this.cursor.material.uniforms.scale.value = this.cursor.scale;
    this.cursor.material.uniforms.rotatedMode.value = this.rotatedMode ? 1 : 0;
  }

  VoxelColumnTool.prototype.updateVoxel = function(position, features, mirrorFactor) {
    var voxel;
    const direction = this.extrusionNormal.largestComponent();
    const extrusionNormal = this.extrusionNormal.clone();
    extrusionNormal.setComponent(direction, mirrorFactor * extrusionNormal.getComponent(direction));

    const voxels = [];

    while ((voxel = this.voxelGrid.voxelAtPosition(position)) && (!this.mirror[direction] ||  mirrorFactor * position.getComponent(direction) > 0)) {
      var voxel;
      switch (this.activeBrush.type) {
        case "texture": 
          voxel = new TextureCell(position, this.activeBrush.name, this.stiffness);
          break;
        default:
          voxel = new MechanicalCell(position, features, this.extrusionNormal.largestComponent(), this.stiffness);
      }
      this.voxelGrid.addVoxel(voxel, position);
      voxels.push(voxel);
      position.sub(extrusionNormal);
    }

    this.activeBrush.used = true;

    return voxels;
  }

  return VoxelColumnTool;

})();
