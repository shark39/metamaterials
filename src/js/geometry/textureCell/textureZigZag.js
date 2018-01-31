'use strict';
const Texture = require('./texture');
const THREE = require('three');
const ThreeBSP = require('three-js-csg')(THREE);
const PrismGeometry = require('./prism.js');

class ZigZagTexture extends Texture {
  textureType() {
    return "zigzag"
  }
  static isCustomizable() {
    return true
  }
  static drawing() {
    return [
      [0.1, 0.1],
      [0.9, 0.9]
    ];
  }

  inner() {
    //diagonal gap, thinner surface on top

    var textureGeometry = new THREE.Geometry();

    var middleConnector = this.middleZigZag();
    middleConnector.computeBoundingBox();
    middleConnector.translate(this.width / 2 - middleConnector.boundingBox.max.x / 2, -middleConnector.boundingBox.max.y - this.surfaceHeight, 0);
    textureGeometry.merge(middleConnector);

    var topPlane = new THREE.BoxGeometry(this.width, this.surfaceHeight, this.length);

    this.zigzagGap = this.width / 16;
    var negativ = new THREE.BoxGeometry(this.zigzagGap, this.surfaceHeight * 2, Math.sqrt((this.length * 2) ** 2 + this.width ** 2));
    negativ.rotateZ(Math.PI / 4);
    negativ.rotateY(Math.sin(1.4));
    negativ.translate(0, -0.08, 0);
    var topPlaneBSP = new ThreeBSP(topPlane);
    var negativBSP = new ThreeBSP(negativ);
    var result = topPlaneBSP.subtract(negativBSP);
    topPlane = result.toMesh().geometry;
    topPlane.translate(this.width / 2, -this.surfaceHeight / 2, 0);
    textureGeometry.merge(topPlane);

    return textureGeometry;
  }

  middleZigZag() {
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
}

module.exports = ZigZagTexture