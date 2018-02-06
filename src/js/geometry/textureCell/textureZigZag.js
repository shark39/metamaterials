'use strict';
const CustomTexture = require('./textureCustom');
const THREE = require('three');
const ThreeBSP = require('three-js-csg')(THREE);
const merge = require('./merge');



class ZigZagTexture extends CustomTexture {


  textureType() {
    return "zigzag"
  }
  static isCustomizable() {
    return true
  }
  static drawing() {
    return [
      [0.1, 0.1],
      [0.9, 0.5],
      [0.1, 0.9]
    ];
  }

  cells() {
    return this.cellCount || 2;
  }

  static cells() {
    return 2;
  }

  static isCustom() {
    return false;
  }

  static cacheKey() {
    return 'zigzag';
  }

  customInner() { //workarond
    //generate a negativ from the canvas path
    var height = this.surfaceHeight + this.memberHeight;
    var gap = 0.05;
    var path = new THREE.Curve();
    //path.getPoint = (t) => CustomTexture.getPoint(t); //this function is required for extrude geometry
    path.getPoint = (t) => this.getPoint(t); //this function is required for extrude geometry

    var shapePoints = [
      new THREE.Vector2(0, -gap),
      new THREE.Vector2(this.surfaceHeight, -gap),
      new THREE.Vector2(height, -gap * 2.5),
      new THREE.Vector2(height, gap * 2.5),
      new THREE.Vector2(this.surfaceHeight, gap),
      new THREE.Vector2(0, gap),
      new THREE.Vector2(0, -gap)
    ];

    var extrudeSettings = {
      steps: 50,
      bevelEnabled: false,
      extrudePath: path
    };
    var shape = new THREE.Shape(shapePoints);
    //var pathGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);


    var pathGeometry = ZigZagTexture.drawing().reduce(
      (accumulator, currentValue, currentIndex, array) => {
        if (currentIndex == 0) return accumulator;
        extrudeSettings.extrudePath.getPoint = (t) => ZigZagTexture.getPointForPart(currentValue, currentIndex, array, t);
        return merge(accumulator, new THREE.ExtrudeGeometry(shape, extrudeSettings));
      }, new THREE.Geometry());

    pathGeometry.translate(-this.width / 2, this.surfaceHeight / 2, -this.length / 2 * this.cellCount);

    var topPlane = new THREE.BoxGeometry(this.width, this.surfaceHeight, this.length);
    var memberPlane = new THREE.BoxGeometry(this.width - 2 * this.wallWidth - 2 * this.hingeWidth, this.memberHeight, 1);
    memberPlane.translate(0, -this.surfaceHeight, 0);
    topPlane = merge(topPlane, memberPlane);
    topPlane.scale(1, 1, this.cellCount);
    var topPlaneBSP = new ThreeBSP(topPlane);
    var negativBSP = new ThreeBSP(pathGeometry);
    var result = topPlaneBSP.subtract(negativBSP);
    var height = this.height - this.surfaceHeight;
    var middleConnector = new THREE.BoxGeometry(this.middleConnectorWidth, height, this.length * this.cellCount);
    pathGeometry.translate(0, 0.5,0);
    negativBSP = new ThreeBSP(pathGeometry);
    var middleBSP = new ThreeBSP(middleConnector).subtract(negativBSP);
    var middle = middleBSP.toMesh().geometry;
    middle.translate(0.5, -height / 2 + 0.5, 0);

    topPlane = result.toMesh().geometry;
    topPlane.translate(0.5, 0.5, 0);
    topPlane = merge(topPlane, middle);
    return topPlane;
  }


/*  middleZigZag() {
    var A = new THREE.Vector2(-0.5, 0);
    var B = new THREE.Vector2(-0.15, this.amplitude);
    //var p = this.width / 2 - 2 * this.hingeWidth - this.wallWidth - this.middleConnectorWidth / 2;
    var C = new THREE.Vector2(0.15, this.amplitude);
    var D = new THREE.Vector2(0.5, 0);

    var m = new PrismGeometry([A, B, C, D], 0.2);
    m.rotateY(Math.PI / 2);
    //member.translate(-this.middleConnectorWidth / 2 - this.hingeWidth - B.x, -this.memberHeight - this.surfaceHeight, -this.length / 2);
    return m;
  }
  */
}

module.exports = ZigZagTexture
