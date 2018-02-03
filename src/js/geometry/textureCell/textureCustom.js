'use strict';
const Texture = require('./texture');
const THREE = require('three');
const ThreeBSP = require('three-js-csg')(THREE);

class CustomTexture extends Texture {
  textureType() {
    return "custom"
  }
  static isCustomizable() {
    return true
  }
  static drawing() {
    return CustomTexture.drawing() || [];
  }

  cells() {
    return CustomTexture.cells() || 1;
  }

  inner() {
    //generate a negativ from the canvas path
    var height = this.surfaceHeight;
    var gap = 0.05;
    var path = new THREE.Curve();
    path.getPoint = (t) => CustomTexture.getPoint(t); //this function ist required for extrude geometry

    var shapePoints2 = [new THREE.Vector2(0, -gap),
      new THREE.Vector2(0.3 * height, -gap),
      new THREE.Vector2(height, -gap * 1.5),
      new THREE.Vector2(height, gap * 1.5),
      new THREE.Vector2(0.3 * height, gap),
      new THREE.Vector2(0, gap),
      new THREE.Vector2(0, -gap)
    ];

    var extrudeSettings = {
      steps: 100,
      bevelEnabled: false,
      extrudePath: path
    };
    var shape = new THREE.Shape(shapePoints2);
    var pathGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    pathGeometry.translate(-this.width / 2, this.surfaceHeight / 2, -this.length / 2);

    var textureGeometry = new THREE.Geometry();

    var topPlane = new THREE.BoxGeometry(this.width, this.surfaceHeight, this.length, 4, 4, 4);
    var topPlaneBSP = new ThreeBSP(topPlane);
    var negativBSP = new ThreeBSP(pathGeometry);
    var result = topPlaneBSP.subtract(negativBSP);
    topPlane = result.toMesh().geometry;
    topPlane.translate(this.width / 2, -this.surfaceHeight / 2, 0);
    textureGeometry.merge(topPlane);
    return textureGeometry;
  }

  _buildGeometry() {  //override
    let geo = super._buildGeometry();
    geo.scale(1, 1, this.cellCount);
    return geo;
  }
}

module.exports = CustomTexture
