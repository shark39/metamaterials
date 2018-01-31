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
    if(intersection.object.isPlane) return;
    let voxel = intersection.object.userData.voxel;
    
    let startPosition = voxel.position.clone();
    let endPosition = startPosition.clone().add(new THREE.Vector3(...voxel.size())).addScalar(-1);
    return {
            startPosition,
            endPosition,
            extrusionNormal: intersection.face.normal.clone()
          }
  }

  VoxelEditTool.prototype.processRect = function() {
    if (!this.startPosition) { return };

    const intersectionVoxels = Object.values(this.voxelGrid.intersectionVoxels);
    const intersection = this.extrusionParametersFromIntersection(this.raycaster.intersectObjects(intersectionVoxels)[0]);
    if (!intersection) { return };

    let ifStartArea = intersection.startPosition.clone().sub(this.startRect.end).lengthSq();
    let ifEndArea = this.startRect.start.clone().sub(intersection.endPosition).lengthSq();

    if(ifStartArea > ifEndArea) {
      this.startPosition = intersection.startPosition.clone();
      this.endPosition = this.startRect.end.clone();
    } else {
      this.startPosition = this.startRect.start.clone();
      this.endPosition = intersection.endPosition.clone();
    }

    this.updateSelection();
  }

  VoxelEditTool.prototype.updateCursor = function() {
    this.cursor.mesh.scale.setComponent(this.extrusionComponent, 0.1);
    this.cursor.mesh.position.add(this.extrusionNormal.clone().multiplyScalar(0.7));
    this.cursor.mesh.material.uniforms.scale.value = this.cursor.mesh.scale;
    this.cursor.mesh.material.uniforms.rotatedMode.value = this.rotatedMode ? 1 : 0;
  }

  VoxelEditTool.prototype.updateVoxel = function(position, features, stiffness) {
    var voxel;
    const voxels = [];

    let prevVoxel = this.voxelGrid.voxelAtPosition(position);
    while (voxel = this.voxelGrid.voxelAtPosition(position)) {
      if(prevVoxel.type() !== voxel.type() && voxel.type() !== "voxel") break;
      if(prevVoxel.orientation && voxel.orientation && 
        !prevVoxel.orientation.equals(voxel.orientation)) {
        break;
      } 
      voxels.push(voxel);
      position.sub(this.extrusionNormal);
      prevVoxel = voxel;
    }

    var voxel = undefined;
    let direction = this.extrusionNormal.largestComponent();
    let minThickness = this.voxelGrid.minThickness;

    if(!prevVoxel.orientation || prevVoxel.orientation.equals(this.extrusionNormal)) {
      createVoxels.bind(this)(voxels, this.extrusionNormal);
    } else {
      let center = Math.ceil(voxels.length/2);
      createVoxels.bind(this)(voxels.slice(0,center), this.extrusionNormal);
      createVoxels.bind(this)(voxels.slice(center, voxels.length).reverse(), this.extrusionNormal.clone().negate());
    }

    this.activeBrush.used = true;
    return voxels[0];

    function createVoxels(voxels, orientation) {
      for(var i = 0; i < voxels.length; i++) {
        let relativeExtrusion = 1-i/(voxels.length-1);
        let voxel = voxels[i];
        voxel = new this.activeBrush.class(voxel.position, {
          stiffness,
          minThickness,
          features,
          direction,
          orientation,
          relativeExtrusion
        });
        this.voxelGrid.addVoxel(voxel, voxel.position);
      }
    }
  }

  return VoxelEditTool;

})();
