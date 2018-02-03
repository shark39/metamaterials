'use strict';
const Texture = require('./texture');
const THREE = require('three');
const PrismGeometry = require('./prism.js');

class BoxTexture extends Texture {
  textureType() {
    return "box"
  }
  static isCustomizable() {
    return false
  }
  static drawing() {
    return [
      [0.3, 0],
      [0.7, 0],
      [0.7, 1],
      [0.3, 1],
      [0.3, 0]
    ];
  }

  cells() {
    return this.cellCount || 1;
  }

  inner() {
    var textureGeometry = new THREE.Geometry();

    var middleConnector = this.middleBox(0.3, 0.5);
    middleConnector.translate(this.width / 2, 0, -this.length / 2);
    textureGeometry.merge(middleConnector);

    textureGeometry.merge(this.members());
    textureGeometry.merge(this.surface());

    return textureGeometry;
  }

  middleBox(widthTop, widthBottom) {
    var A = new THREE.Vector2(-widthBottom / 2, 0);
    var B = new THREE.Vector2(-widthTop / 2, -(this.height) / 2);
    var C = new THREE.Vector2(widthTop / 2, -(this.height) / 2);
    var D = new THREE.Vector2(widthBottom / 2, 0);
    var m = new PrismGeometry([A, B, C, D], this.length);
    return m;
  }

  members() {

    var textureGeometry = this.member(1, false);
    textureGeometry.translate(this.wallWidth + this.hingeWidth, -this.memberHeight - this.surfaceHeight, -this.length / 2);

    var member2 = this.member(-1, false);
    member2.translate(this.width / 2 + this.middleConnectorWidth / 2 + this.hingeWidth + this.memberWidth, -this.memberHeight - this.surfaceHeight, -this.length / 2);
    textureGeometry = this.merge(textureGeometry, member2);
    return textureGeometry;
  }
}

module.exports = BoxTexture
