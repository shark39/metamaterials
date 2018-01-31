'use strict';

const bind = require('../misc/bind');
const Cursor = require('../misc/cursor');
const Tool = require('./tool');

const Texture = require('../geometry/textureCell/texture');
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

    let params = this.extrusionParametersFromIntersection(intersection);
    if(!params) {
      this.startPosition = undefined;
      return this.updateSelection();
    }
    this.extrusionComponent = params.extrusionNormal.largestComponent();
    this.extrusionNormal = params.extrusionNormal;
    this.startPosition = params.startPosition;
    this.endPosition = params.endPosition || this.startPosition.clone();
    this.startRect = {start: params.startPosition, end: params.endPosition};

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
      this.endPosition = intersection.clone().sub(this.startPosition).round().add(this.startPosition);
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
      this.cursor.mesh.visible = false;
      this.infoBox.hide();
      return;
    }
    this.cursor.mesh.visible = true;

    if (this.cuboidMode) {
      this.infoBox.show();
    } else {
      this.infoBox.hide();
    }

    this.startPosition.clamp(this.minPosition, this.maxPosition);
    this.endPosition.clamp(this.minPosition, this.maxPosition);

    const start = this.startPosition.clone().min(this.endPosition);
    const end = this.startPosition.clone().max(this.endPosition);

    if (!this.lastPosition.start.equals(start) || !this.lastPosition.end.equals(end)) {
      this.cursor.isShader ? this.renderSelectionShader(start, end) : this.renderSelectionGeometry(start, end);
      this.lastPosition = {start, end};
    }
  }

  VoxelTool.prototype.renderSelectionShader = function(start, end) {
    
    this.cursor.mesh.position.copy(start.clone().add(end).divideScalar(2.0));
    let scale = end.clone().sub(start).addScalar(1.0+this.cursor.cursorBorder);
    this.cursor.mesh.scale.copy(scale);
    this.cursor.mesh.rotation.fromArray([0.0, 0.0, 0.0]);

    this.cursor.mesh.material.uniforms.scale.value.copy(this.cursor.mesh.scale);
    this.cursor.mesh.material.uniforms.rotatedMode.value = 0;
    this.cursor.mesh.material.uniforms.rotatedDirection.value = this.extrusionComponent;

    this.infoBox.html('size ' + this.cursor.mesh.scale.toArray().join(' x '));

    this.updateCursor(); //implemented in voxel_edit_tool
  }

  VoxelTool.prototype.renderSelectionGeometry = function(start, end) {
    var voxel;
    voxel = new this.activeBrush.class(undefined, {orientation: this.extrusionNormal});
    if (voxel.textureType().startsWith('custom')) {
      voxel.canvasdrawer = this.activeBrush.canvasdrawer;
    }
    var cursorGeometry = this.createSelectionGeometry(voxel, end.x - start.x, end.y - start.y, end.z - start.z);

    cursorGeometry.translate(-(end.x - start.x) / 2, -(end.y - start.y) / 2, -(end.z - start.z) / 2);
    this.cursor.setGeometry(cursorGeometry);
    this.cursor.mesh.position.copy(start.clone().add(end).divideScalar(2.0));
  }

  VoxelTool.prototype.createSelectionGeometry = function (voxel, sx, sy, sz) {
    var geo = voxel.getGeometry().clone();
    var size = voxel.size();

    var clone = geo.clone();
    for (var x = size[0]; x <= sx; x += size[0]) {
      clone.translate(size[0], 0, 0);
      geo.merge(clone);
    }
    var clone = geo.clone();
    for (var y = size[1]; y <= sy; y += size[1]) {
      clone.translate(0, size[1], 0);
      geo.merge(clone);
    }
    var clone = geo.clone();
    for (var z = size[2]; z <= sz; z += size[2]) {
      clone.translate(0, 0, size[2]);
      geo.merge(clone);
    }
    return geo.clone();
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

    let lc = end.clone().sub(start).largestComponent();
    let ec = this.extrusionComponent;
    let reverseOrder = !start.equals(this.startPosition);
    var voxel, size;
    for (var x = start.x; x <= end.x; x+=size[0])
      for (var y = start.y; y <= end.y; y+=size[1])
        for (var z = start.z; z <= end.z; z+=size[2]) {
          let stiffness = this.calculateStiffness([x,y,z][lc], start.getComponent(lc), end.getComponent(lc));
          let relativeExtrusion = ([x,y,z][ec]-start.getComponent(ec)) / (end.getComponent(ec) - start.getComponent(ec));
          if(reverseOrder) relativeExtrusion = 1 - relativeExtrusion;
          relativeExtrusion = isNaN(relativeExtrusion) ? undefined : relativeExtrusion;
          voxel = this.updateSingleVoxel(new THREE.Vector3(x, y, z), new THREE.Vector2(x - start.x, z - start.z), stiffness, relativeExtrusion)
          size = voxel && voxel.size() || [1,1,1];
        }

    this.voxelGrid.update();
    this.setCuboidMode(this.cuboidMode, this.rotatedMode);
    this.processSingle();
  }

  VoxelTool.prototype.updateSingleVoxel = function(position, offset, stiffness, relativeExtrusion) {

    if (this.activeBrush.type == "texture") {
      return this.updateVoxel(position, null, stiffness, relativeExtrusion);
    }
    const cellCoords = [offset.y % this.activeBrush.height, offset.x % this.activeBrush.width];
    const features = this.activeBrush.cells[cellCoords].features;
    return this.updateVoxel(position, features, stiffness, relativeExtrusion);
  }

  VoxelTool.prototype.__defineGetter__('activeBrush', function() {
    return this._activeBrush;
  });

  VoxelTool.prototype.__defineSetter__('activeBrush', function(activeBrush) {
    this._activeBrush = activeBrush;

    if (activeBrush.type == 'texture' && this.cursor.isAddMode) {
      var texture = new activeBrush.texture(new THREE.Vector3());
      texture.canvasdrawer = activeBrush.canvasdrawer;
      this.cursor.setGeometry(texture._buildGeometry());
    } else {
      this.cursor.shaderMode();
    }
    if (activeBrush.type != 'texture') {
      this.cursor.mesh.material.uniforms.image.value = new THREE.Texture(activeBrush.textureIcon);
      this.cursor.mesh.material.uniforms.image.value.needsUpdate = true;
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
