'use strict';

const bind  = require('../misc/bind');
const VoxelTool  = require('./voxel_tool');
const MechanicalCell = require('../geometry/mechanicalCell/mechanicalCell');
const TextureCell = require('../geometry/textureCell/texture');
const BentTexture = require('../geometry/textureCell/bentTexture');

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
    
    let startPosition =  intersection.object.position.clone();
    let orientation = intersection.face.normal.clone();
    return {
            startPosition,
            extrusionNormal: intersection.face.normal.clone()
          }
  }

  VoxelEditTool.prototype.updateCursor = function() {

    let scale = this.endPosition.clone().sub(this.startPosition).addScalar(1);
    scale.setComponent(this.extrusionComponent, 0.2);
    let scaleCorrection = scale.clone().divideScalar(2);

    this.cursor.mesh.scale.copy(scale);
    this.cursor.mesh.position.copy(this.startPosition).subScalar(0.5).add(scaleCorrection).add(this.extrusionNormal);
    this.cursor.mesh.material.uniforms.scale.value = this.cursor.mesh.scale;
  }

  VoxelEditTool.prototype.updateVoxel = function(position, {features, stiffness}) {
    const voxels = [];
    var voxel = this.voxelGrid.voxelAtPosition(position);
    if(!voxel) return;

    if(voxel.type() === "cylinder") {
      voxel = new BentTexture(voxel.position, {
        ...this.activeBrush.options,
        orientation: voxel.orientation,
        diameter: voxel.diameter,
        texture: this.activeBrush.class
      });
      this.voxelGrid.addVoxel(voxel, voxel.position);
      return voxel;
    }

    let prevVoxel = voxel;
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

    if(prevVoxel.orientation && prevVoxel.orientation.equals(this.extrusionNormal.clone().negate())) {
      let center = Math.ceil(voxels.length/2);
      createVoxels.bind(this)(voxels.slice(0,center), this.extrusionNormal);
      createVoxels.bind(this)(voxels.slice(center, voxels.length).reverse(), this.extrusionNormal.clone().negate());
    } else {
      createVoxels.bind(this)(voxels, this.extrusionNormal);
    } 

    this.activeBrush.used = true;
    return voxels[0];

    function createVoxels(voxels, orientation) {
      for(var i = 0; i < voxels.length; i++) {
        let relativeExtrusion = 1-i/(voxels.length-1);
        relativeExtrusion = isNaN(relativeExtrusion) ? undefined : relativeExtrusion;
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
