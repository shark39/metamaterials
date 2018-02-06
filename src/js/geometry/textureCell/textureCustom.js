'use strict';
const Texture = require('./texture');
const PrismGeometry = require('./prism.js');
const THREE = require('three');
const ThreeBSP = require('three-js-csg')(THREE);
const merge = require('./merge');

class CustomTexture extends Texture {
  textureType() {
    return "custom"
  }
  static isCustomizable() {
    return true
  }
  static drawing() {
    return [];
  }

  cells() {
    return CustomTexture.cells() || 1;
  }

  static cells() {
    return 1; //should be overwritten by mixin
  }

  static isCustom() {
    return true;
  }

  cacheKey() {
    return this.constructor.cacheKey() + super.cacheKey();
  }

  inner() {
    return new THREE.Geometry();
  }

  customInner() {
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


    var pathGeometry = CustomTexture.drawing().reduce(
      (accumulator, currentValue, currentIndex, array) => {
        if (currentIndex == 0) return accumulator;
        extrudeSettings.extrudePath.getPoint = (t) => CustomTexture.getPointForPart(currentValue, currentIndex, array, t);
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
    var points = [new THREE.Vector2(0, 0),
                new THREE.Vector2(0, height/4),
                //new THREE.Vector2(this.middleConnectorWidth/2 - this.minThickness/2, height),
                //new THREE.Vector2(this.middleConnectorWidth/2 - this.minThickness/2, height),
                new THREE.Vector2(this.middleConnectorWidth/2, height),
                new THREE.Vector2(this.middleConnectorWidth, height/4),
                new THREE.Vector2(this.middleConnectorWidth, 0)
              ];

    var middleConnector = new PrismGeometry(points, this.length * this.cellCount);
    middleConnector.translate(-this.middleConnectorWidth/2, -height/2, -this.length * this.cellCount / 2);
    //var middleConnector = new THREE.BoxGeometry(this.middleConnectorWidth, height, this.length * this.cellCount);
    pathGeometry.translate(0, 0.5,0);
    negativBSP = new ThreeBSP(pathGeometry);
    var middleBSP = new ThreeBSP(middleConnector).subtract(negativBSP);
    var middle = middleBSP.toMesh().geometry;
    middle.translate(0.5, -height / 2 + 0.5, 0);

    topPlane = result.toMesh().geometry;
    //verbindungsstrebe oben
    var topMiddleConnector = new THREE.BoxGeometry(this.middleConnectorWidth, this.surfaceHeight, this.length * this.cellCount);
    //topMiddleConnector.translate()
    topPlane = merge(topPlane, topMiddleConnector);
    topPlane.translate(0.5, 0.5, 0);
    topPlane = merge(topPlane, middle);

    return topPlane;
  }

  _buildGeometry() {
    let geo = super._buildGeometry();
    geo.scale(1, 1, this.cellCount);
    geo = merge(geo, this.customInner());
    geo.translate(0, 0, -0.5 + 0.5 * this.cellCount);
    return geo;
  }


  static getPointForPart(point, index, array, t) {
    const scaleToSize = (x, y) => new THREE.Vector2(x * 2, y * this.cells());
    var start = scaleToSize(...array[Math.max(index - 1, 0)]);
    var end = scaleToSize(...point);
    var direction = end.clone().sub(start);
    var point = start.clone().add(direction.clone().multiplyScalar(t));
    return new THREE.Vector3(point.x, 0, point.y);
  }

  pathPartLengthArray() {
    if (this.parts) {
      return this.parts;
    }
    var parts = [];
    CustomTexture.drawing().reduce(
      function(accumulator, currentValue, currentIndex, array) {
        let distance = (new THREE.Vector2(...currentValue)).distanceTo(new THREE.Vector2(...array[Math.max(currentIndex - 1, 0)]));
        parts.push(accumulator + distance);
        return accumulator + distance;
      }, 0);
    return this.parts = parts;
  }

  getPoint(t) {
    //t is in [0;1]; returns Vector with the point as t of the path
    //1. calculate length of whole path
    var path = CustomTexture.drawing();
    var parts = this.pathPartLengthArray();
    var length = parts[parts.length - 1];

    //2. find the right segment
    const scaleToSize = (vec2) => new THREE.Vector2(vec2.x * 2, vec2.y * this.cellCount);
    var i = 0;
    for (i; i < parts.length; i++) {
      if (parts[i] == t * length) {
        var v = scaleToSize(new THREE.Vector2(...path[i]));
        return new THREE.Vector3(v.x, 0, v.y);
      }
      if (parts[i] > t * length) {
        //interpolate
        var start = scaleToSize(new THREE.Vector2(...path[i - 1]));
        var end = scaleToSize(new THREE.Vector2(...path[i]));
        var direction = end.clone().sub(start);
        var start2 = start.clone().add(direction.clone().multiplyScalar(-1 * parts[i - 1])).clone();
        var point = start2.clone().add(end.clone().sub(start2).clone().multiplyScalar(t * length / parts[i])).clone();
        return new THREE.Vector3(point.x, 0, point.y);
      }
    }

  }
}

module.exports = CustomTexture
