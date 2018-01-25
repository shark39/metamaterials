'use strict';

const bind  = require('../misc/bind');
const VoxelTool  = require('./voxel_tool');
const MechanicalCell = require('../geometry/mechanicalCell/mechanicalCell');
const TextureCell = require('../geometry/textureCell/texture');

const THREE = require('three');

module.exports = (function() {

  function VoxelEditTool(renderer, voxelGrid) {
    bind(this);
    VoxelTool.call(this, renderer, voxelGrid);

    this.allowCube = false;
    this.setCuboidMode(true, false);
  }

  VoxelEditTool.prototype = Object.create(VoxelTool.prototype);

  VoxelEditTool.prototype.reset = function() {
    this.cursor.editMode();
  }

  VoxelEditTool.prototype.extrusionParametersFromIntersection = function(intersection) {
    return intersection.object.isPlane ? {
      startPosition: intersection.object.position.clone(),
      extrusionNormal: intersection.face.normal.clone()
    } : {
      startPosition: intersection.object.position.clone(),
      extrusionNormal: intersection.face.normal.clone()
    }
  }

  VoxelEditTool.prototype.updateCursor = function() {
    if (this.activeBrush.type == "texture") {
      this.cursor.mesh.scale.setComponent(0, 2);
      this.cursor.mesh.position.add(new THREE.Vector3(0.5, 0, 0));
    }
    this.cursor.mesh.scale.setComponent(this.extrusionComponent, 0.1);
    this.cursor.mesh.position.add(this.extrusionNormal.clone().multiplyScalar(0.7));
    this.cursor.mesh.material.uniforms.scale.value = this.cursor.mesh.scale;
    this.cursor.mesh.material.uniforms.rotatedMode.value = this.rotatedMode ? 1 : 0;

  }

  VoxelEditTool.prototype.updateVoxel = function(position, features, stiffness) {
    var voxel;
    const direction = this.extrusionNormal.largestComponent();
    const voxels = [];

    while (voxel = this.voxelGrid.voxelAtPosition(position)) {
      this.voxelGrid.removeVoxel(position);
      switch (this.activeBrush.type) {
        case "texture":
        var texture = new this.activeBrush.texture();
        if (texture.name.startsWith('custom')) {
          texture.canvasdrawer = this.activeBrush.canvasdrawer;
        }
          voxel = new TextureCell(position, texture, stiffness, this.extrusionNormal);
          break;
        default:
          voxel.setFeaturesInDirection(features, direction, stiffness);
      }
      this.voxelGrid.addVoxel(voxel, position);
      voxels.push(voxel);
      position.sub(this.extrusionNormal);
    }

    this.activeBrush.used = true;

    return voxels;
  }

  return VoxelEditTool;

})();
