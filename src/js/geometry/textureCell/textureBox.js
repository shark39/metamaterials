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
    return this.cellCount || BoxTexture.cells();
  }

  static cells() {
    return 1;
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
    let height = this.fullMiddleConnector ? this.height : this.height - this.surfaceHeight;
    var points = [
      new THREE.Vector2(-widthBottom / 2, 0),
      new THREE.Vector2(-widthTop / 2, -height),
      new THREE.Vector2(widthTop / 2, -height),
      new THREE.Vector2(widthBottom / 2, 0)
    ];
    var m = new PrismGeometry(points, this.length);
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
