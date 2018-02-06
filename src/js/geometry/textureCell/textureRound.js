'use strict';
const Texture = require('./texture');
const THREE = require('three');

class RoundTexture extends Texture {
  textureType() {
    return "round"
  }
  static isCustomizable() {
    return false
  }
  static drawing() {
    return [
      [0.3, 0],
      [0.7, 0],
      [0.8, 0.2],
      [0.8, 0.8],
      [0.7, 1],
      [0.3, 1],
      [0.2, 0.8],
      [0.2, 0.2],
      [0.3, 0]
    ];
  }

  cells() {
    return this.cellCount || 1;
  }

  static cells() {
    return 1;
  }

  inner() {
    var textureGeometry = new THREE.Geometry();

    var middleConnector = new THREE.BoxGeometry(this.middleConnectorWidth, this.amplitude, this.length);
    middleConnector.translate(this.width / 2, -this.amplitude / 2, 0);
    textureGeometry.merge(middleConnector);

    var memberWidth = this.memberWidth - 0.3 / 2;
    var member1 = this.member(1, false, {
      memberWidth: memberWidth
    });
    member1.translate(this.wallWidth + this.hingeWidth, -this.memberHeight - this.surfaceHeight, -this.length / 2);
    textureGeometry.merge(member1);

    var member2 = this.member(-1, false, {
      memberWidth
    });
    member2.translate(this.width / 2 + this.middleConnectorWidth / 2 + this.hingeWidth + this.memberWidth, -this.memberHeight - this.surfaceHeight, -this.length / 2);
    textureGeometry.merge(member2);

    textureGeometry.merge(this.surface());

    return textureGeometry;
  }
}

module.exports = RoundTexture
