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

  cacheKey() {
    return CustomTexture.cacheKey() + super.cacheKey();
  }

  inner() {
    //generate a negativ from the canvas path
    var height = this.surfaceHeight;
    var gap = 0.05;
    var path = new THREE.Curve();
    //path.getPoint = (t) => CustomTexture.getPoint(t); //this function is required for extrude geometry
    path.getPoint = (t) => this.getPoint(t); //this function is required for extrude geometry

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

  _buildGeometry() { //override
    let geo = super._buildGeometry();
    geo.scale(1, 1, this.cellCount);
    return geo;
  }

  getPoint(t) {
    //t is in [0;1]; returns Vector with the point as t of the path
    //1. calculate length of whole path

    //var parts = [0]; //array with total length till point i

    var path = CustomTexture.drawing();
    var parts = [];
    var length = path.reduce(
      function(accumulator, currentValue, currentIndex, array) {
        let distance = (new THREE.Vector2(...currentValue)).distanceTo(new THREE.Vector2(...array[Math.max(currentIndex - 1, 0)]));
        parts.push(accumulator + distance);
        return accumulator + distance;
      }, 0);

    //in lang:
    /*var length = 0;
    var parts = [0];
    for (var i = 1; i < path.length; i++) {
      var v1 = new THREE.Vector2(...path[i - 1]);
      var v2 = new THREE.Vector2(...path[i]);

      var distance = v2.distanceTo(v1);
      length += distance;
      parts.push(length);
    }*/


    //2. find the right segment
    //
    var i = 0;
    for (i; i < parts.length; i++) {
      if (parts[i] == t * length) {
        return new THREE.Vector3(path[i][0]*2, 0, path[i][1]);
      }
      if (parts[i] > t * length) {
        //interpolate
        var start = [path[i - 1][0]*2, path[i - 1][1]];
        var end = [path[i][0]*2, path[i][1]];
        var point = [t * (end[0] - start[0]) + start[0], t * (end[1] - start[1]) + start[1]];
        return new THREE.Vector3(point[0], 0, point[1]);
      }
    }

  }
}

module.exports = CustomTexture
