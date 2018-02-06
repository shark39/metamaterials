'use strict';

const bind = require('../misc/bind');
const VoxelTool = require('./voxel_tool');
const THREE = require('three');

module.exports = (function () {

  function VoxelAddTool(renderer, voxelGrid) {
    bind(this);
    VoxelTool.call(this, renderer, voxelGrid);

    this.setCuboidMode(true, false);
    this.activeBrushAdd = null;
  }

  VoxelAddTool.prototype = Object.create(VoxelTool.prototype);

  VoxelAddTool.prototype.extrusionParametersFromIntersection = function (intersection) {
    return intersection.object.isPlane ? {
      startPosition: intersection.point.floor().addScalar(0.5),
      extrusionNormal: new THREE.Vector3(0.0, 1.0, 0.0)
    } : {
      startPosition: intersection.object.position.clone().add(intersection.face.normal),
      extrusionNormal: intersection.face.normal.clone()
    }
  }

  VoxelAddTool.prototype.extrusionLengthFromIntersection = function (intersection) {
    return Math.max(Math.round(intersection), 0.0);
  }

  // This break the current selection and acts as a reset.
  // It is more like a hack.
  VoxelAddTool.prototype.reset = function () {
    this.setCuboidMode(true, false);
    this.cursor.addMode();
  }

  VoxelAddTool.prototype.updateVoxel = function (position, options = {}) {
    var voxel = undefined;
    voxel = new this.activeBrush.class(position, options);
    this.voxelGrid.addVoxel(voxel, position);
    this.activeBrush.used = true;
    // /this.activeBrush.usedWith
    return voxel;
  }

  return VoxelAddTool;

})();
