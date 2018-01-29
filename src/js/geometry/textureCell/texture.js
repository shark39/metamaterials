'use strict';

/*
This file contains the geometry construction for the texture voxels

Usage:

var texture = new Texture(options);
texture.getGeometry(type);

supported types:
- regular
- zigzag
- box
- round

*/

const THREE = require('three');
const ThreeBSP = require('three-js-csg')(THREE);
const slicer = require('threejs-slice-geometry')(THREE);

const bind = require('../../misc/bind');


module.exports = (function() {

  function Texture(position, texture, stiffness, orientation=(new THREE.Vector3(0,1,0)), options = {}) {
    /* position is just stored not used
    /* texture is an instance that implements a .getGeometry() function
    /* stiffness = [0;1]
    /* orientation is Vector3 with -1, 0, 1 depending on the orientation
    /*options contains parameters like length, hingeThickness ...*/

    this.stiffness = stiffness;
    this.position = (new THREE.Vector3()).copy(position);
    this.orientation = (new THREE.Vector3()).copy(orientation);
    bind(this);
    let defaultOptions = {
      length: 1,
      height: 1,
      width: 2,
      wallWidth: 0.2,
      middleConnectorWidth: 0.2,
      surfaceHeight: 0.1,
      hingeWidth: 0.08,
      memberHeight: 0.3,
      hingeHeight: 0.1 + this.stiffness / 4 //this is just for visualisation
    };

    if (options.hingeHeight !== undefined) {
      console.warn("overwrite hingeHeight");
    }

    for (let option in defaultOptions) {
      this[option] = options[option] = options[option] || defaultOptions[option];
    }

    this.cacheKey = texture.name + JSON.stringify(options) + stiffness + this.orientation.toArray().toString();
    //calculate width of member
    this.memberWidth = this.width / 2 - this.wallWidth - this.hingeWidth * 2 - this.middleConnectorWidth / 2;

    this.amplitude = Math.sqrt((this.width / 2 - this.wallWidth - this.middleConnectorWidth) ** 2 - this.memberWidth ** 2);
    /*Note for construction
    left wall starts at x=0, right wall ends at x=this.width=2
    top starts at y=0, bottom ends at y=-1
    */

    this.texture = texture;
    this.texture.hingeHeight = options.hingeHeight;
    this.mesh = this.getMesh();
  }

  Texture.prototype.size = function() {
    return [2, 1, 1]
  }

  Texture.prototype.setMinThickness = function() {} //TODO

  Texture.prototype.calculateColor = function() {
    let color = new THREE.Color(this.orientation.x !== 0 ? 1: 0, this.orientation.y !== 0 ? 1: 0, this.orientation.z !== 0 ? 1: 0);
    let l = 1 - (0.8 * this.stiffness + 0.1); // from 0.1 to 0.9
    let hue = (color.getHSL()).h;
    color.setHSL(hue, 1.0, l);
    return color;
  }

  Texture.prototype.getMesh = function() {
    let material = new THREE.MeshPhongMaterial({
      color: this.calculateColor(),
      flatShading: false
    });
    let textureGeometry = this.getBentGeometry();
    return new THREE.Mesh(textureGeometry, material);
  }

  //different geometry types:
  Texture.prototype.getGeometry = function() {

    if (Texture.geometryCache.hasOwnProperty(this.cacheKey) && this.name != "custom")
      return Texture.geometryCache[this.cacheKey];

    let geometries = [
      this.texture.getGeometry(),
      this.texture.getFillGeometry(),
      this.texture._getWallGeometry('left'),
      this.texture._getWallGeometry('right'),
    ];

    var geo = geometries.reduce((sum, geo) => this.texture.merge(sum, geo), new THREE.Geometry());
    geo.translate(-0.5, 0.5, 0);
                                          // facing
    switch (this.orientation.toArray().toString()) {
      case [1, 0, 0].toString():
        geo.rotateZ(3*Math.PI/2); // x
        break;
      case [0, 0, 1].toString():
        geo.rotateX(Math.PI/2); //  z
        break;
      case [0, 0, -1].toString():
        geo.rotateX(3*Math.PI/2); // -z
        break;
      case [0, -1, 0].toString():
        geo.rotateY(Math.PI/2); // rotated, y
        break;
      case [-1, 0, 0].toString():
        geo.rotateZ(Math.PI/2);  // -x
        break;
      default:
    }

    Texture.geometryCache[this.cacheKey] = geo;
    return geo;
  }

  Texture.geometryCache = {};

  Texture.prototype.getBentGeometry = function() {

    if (Texture.geometryCache.hasOwnProperty('B' + this.cacheKey))
      return Texture.geometryCache['B' + this.cacheKey];

    var geometries = [
      this.texture.getGeometry(),
      this.texture.getFillGeometry(),
      this.texture._getWallGeometry('left'),
      this.texture._getWallGeometry('right'),
    ];

    var geo = geometries.reduce((sum, geo) => this.texture.merge(sum, geo), new THREE.Geometry());

    geo.translate(-0.5, 0.5, 0);

    let width = 1.0;
    let steps = 30;
    var stepsize = width / steps;

    var slices = [];
    for (var step = 0; step < steps; step++) {
      let planeZ = step * stepsize;
      var plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0.5 - planeZ);
      var slice = slicer(geo, plane, true);
      plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), -0.5 + planeZ + stepsize);
      var slice = slicer(slice, plane, true);
      slices.push(slice);
    }

    while (slices.length >= 2) {
      let a = slices.shift();
      let b = slices.shift();
      a.merge(b);
      slices.push(a);
    }

    var newGeo = slices[0];
    newGeo.mergeVertices();

    for (var vertex of newGeo.vertices) {
      let actualRadius = Math.sqrt(vertex.z * vertex.z + 1);
      let expectedRadius = Math.sqrt(1.25);
      let scaleY = expectedRadius / actualRadius;

      vertex.z = vertex.z * (vertex.y + 0.5);
      vertex.y = (vertex.y + 0.5) * scaleY - 0.5;
    }

    newGeo.verticesNeedUpdate = true;
    newGeo.computeFlatVertexNormals();

    Texture.geometryCache['B' + this.cacheKey] = newGeo;
    return newGeo;

  }

  return Texture;

})();
