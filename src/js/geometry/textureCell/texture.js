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
//const PrismGeometry = require('./prism.js');
//const TextureRegular = require('./textureRegular');
//const TextureRound = require('./textureRound');


module.exports = (function() {

  function Texture(position, texture, stiffness, options = {}) {
    /* type is reguar, spiky, box, round, zickzag, custom
    /*options contains parameters like length, hingeThickness ...*/

    this.stiffness = stiffness;
    this.position = (new THREE.Vector3()).copy(position);
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
      hingeHeight: 0.1 + this.stiffness/4 //this is just for visualisation
    };

    if (options.hingeHeight !== undefined) {
      console.warn("overwrite hingeHeight");
    }

    for(let option in defaultOptions) {
      this[option] = options[option] = options[option] || defaultOptions[option];
    }

    this.cacheKey = texture + JSON.stringify(options) + stiffness;
    //calculate width of member
    this.memberWidth = this.width/2 - this.wallWidth - this.hingeWidth*2 - this.middleConnectorWidth/2;

    this.amplitude = Math.sqrt((this.width/2-this.wallWidth-this.middleConnectorWidth)**2 - this.memberWidth**2);
    /*Note for construction
    left wall starts at x=0, right wall ends at x=this.width=2
    top starts at y=0, bottom ends at y=-1
    */

    this.texture = texture;
    this.texture.hingeHeight = options.hingeHeight;
    this.mesh = this.getMesh();
  }

  Texture.prototype.size = function () {
    return [2,1,1]
  }

  Texture.prototype.setMinThickness = function () {} //TODO

  Texture.prototype.getMesh = function () {
    var color = new THREE.Color(0, 0, 0 );
    var l = 1 - 0.8 * this.stiffness + 0.1; // from 0.1 to 0.9
    color.setHSL(0, 1, l);
    var material = new THREE.MeshPhongMaterial({
      color: color,
      flatShading: false
    });
    var textureGeometry = this.getGeometry();
    return new THREE.Mesh(textureGeometry, material);
  }

  //different geometry types:
  Texture.prototype.getGeometry = function() {

    if(Texture.geometryCache.hasOwnProperty(this.cacheKey)) 
    return Texture.geometryCache[this.cacheKey];

    var geometries = [
      this.texture.getGeometry(),
      this.texture.getFillGeometry(),
      this.texture._getWallGeometry('left'),
      this.texture._getWallGeometry('right'),
    ];

    var geo = geometries.reduce((sum, geo) => this.texture.merge(sum, geo), new THREE.Geometry());
    geo.translate(-0.5, 0.5, 0);

    Texture.geometryCache[this.cacheKey] = geo;
    return geo;  
  }

  Texture.prototype.getGeometry3 = function() {
    var geometries = [
      this.texture.getGeometry(),
      this.texture.getFillGeometry(),
      this.texture._getWallGeometry('left'),
      this.texture._getWallGeometry('right'),
    ];

    var geo = geometries.reduce((sum, geo) => this.texture.merge(sum, geo), new THREE.Geometry());

    geo.translate(-0.5, 0.5, 0);

    let width = 1.0;
    let steps = 20;
    let radius = 2.0;
    let step_angle = Math.atan(2.0/(radius * steps));

    var stepsize = width/steps;

    var slices = [];
    for(var step = 0; step < steps; step++) {
      var box = new THREE.BoxGeometry(2,1,stepsize);
      box.translate(0.5, 0, -0.5+step*stepsize);
      let toSlice = new ThreeBSP(box);
      var textureGeo = new ThreeBSP(geo);
      var result = textureGeo.intersect(toSlice);
      var slice = result.toMesh().geometry;
      
      slice.translate(0.5,0.5,0);
      for(var vertex of slice.vertices) {
        vertex.z = vertex.z * vertex.y;
      }
      slice.verticesNeedUpdate = true;
      slice.translate(-0.5,-0.5,0);

      let x = Math.abs(steps/2-step) * stepsize;
      let actualRadius = Math.sqrt(x*x + 1);
      let expectedRadius = Math.sqrt(1.25);
      let scaleY = expectedRadius / actualRadius;
      slice.scale(1,scaleY,1);
      slice.translate(0,(scaleY-1)/2,0);
      slices.push(slice);
    }

    while(slices.length >= 2) {
      let a = slices.shift();
      let b = slices.shift();
      a.merge(b);
      slices.push(a);
    }
    
    return slices[0];  

  }

  Texture.geometryCache = {};

  Texture.prototype.getBendedGeometry = function() {

    if(Texture.geometryCache.hasOwnProperty('B'+this.cacheKey)) 
      return Texture.geometryCache['B'+this.cacheKey];

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
    var stepsize = width/steps;

    var slices = [];
    for(var step = 0; step < steps; step++) {
      let planeZ = step*stepsize;
      var plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0.5-planeZ);
      var slice = slicer(geo, plane, true);
      plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), -0.5+planeZ+stepsize);
      var slice = slicer(slice, plane, true);
      slices.push(slice);
    }

    while(slices.length >= 2) {
      let a = slices.shift();
      let b = slices.shift();
      a.merge(b);
      slices.push(a);
    }
    
    var newGeo = slices[0];
    newGeo.mergeVertices();

    for(var vertex of newGeo.vertices) {
      let actualRadius = Math.sqrt(vertex.z*vertex.z + 1);
      let expectedRadius = Math.sqrt(1.25);
      let scaleY = expectedRadius / actualRadius;
      
      vertex.z = vertex.z * (vertex.y+0.5);
      vertex.y = (vertex.y+0.5)*scaleY - 0.5;
    }

    newGeo.verticesNeedUpdate = true;
    newGeo.computeFlatVertexNormals();

    Texture.geometryCache['B'+this.cacheKey] = newGeo;
    return newGeo;  

  }  

  return Texture;

})();
 