'use strict';
const Texture = require('./texture');
const THREE = require('three');

class RegularTexture extends Texture {
  textureType() {
    return "regular"
  }
  static isCustomizable() {
    return true
  }
  static drawing() {
    return [
      [0.5, 0],
      [0.5, 1]
    ];
  }

  cells() {
    return this.cellCount || 1;
  }

  inner() {

    let geo = new THREE.Geometry();

    var middleConnector = this.middleConnector();
    geo = this.merge(geo, middleConnector);

    var member1 = this.member(1, false);
    member1.translate(this.wallWidth + this.hingeWidth, -this.memberHeight - this.surfaceHeight, -this.length / 2);
    geo = this.merge(geo, member1);

    var member2 = this.member(-1, false);
    member2.translate(this.width / 2 + this.middleConnectorWidth / 2 + this.hingeWidth + this.memberWidth, -this.memberHeight - this.surfaceHeight, -this.length / 2);
    geo = this.merge(geo, member2);

    geo = this.merge(geo, this.surface());

    //hinges
    var hingeOffsets = [this.wallWidth,
      this.memberWidth,
      this.middleConnectorWidth,
      this.memberWidth
    ]
    var offset = 0;
    for (var i = 0; i < hingeOffsets.length; i++) {
      offset += hingeOffsets[i];
      var box = new THREE.BoxGeometry(this.hingeWidth, this.hingeHeight, this.length);
      box.translate(this.hingeWidth / 2 + i * this.hingeWidth + offset, -this.hingeHeight / 2, 0);
      geo = this.merge(geo, box);
    }

    return geo;
  }
}

module.exports = RegularTexture
