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

const bind = require('../../misc/bind');
const PrismGeometry = require('./prism.js');
const TextureRegular = require('./textureRegular');
const TextureRound = require('./textureRound');


module.exports = (function() {

  function Texture(position, texture, stiffness, options) {
    /* type is reguar, spiky, box, round, zickzag, custom
    /*options contains parameters like length, hingeThickness ...*/

    this.stiffness = stiffness;
    this.position = (new THREE.Vector3()).copy(position);
    bind(this);
    options = {memberHeight: 0.33, wallWidth: 0.2, middleConnectorWidth: 0.2};
    options = options != undefined ? options : {};
    this.length = options.length || 1;
    this.height = options.height || 1;
    this.width = options.width || 2;
    this.wallWidth = options.wallWidth || 0.3;
    this.middleConnectorWidth = options.middleConnectorWidth || 0.2;
    this.surfaceHeight = options.surfaceHeight || 0.1;
    this.hingeWidth = options.hingeWidth || 0.08;

    this.memberHeight = options.memberHeight || 0.15;

    this.hingeHeight = 0.1 + this.stiffness/4; //this is just for visualisation
    if (options.hingeHeight != undefined) {
      console.warn("overwrite hingeHeight");
      this.hingeHeight = options.hingeHeight;
    }

    //calculate width of member
    this.memberWidth = this.width/2 - this.wallWidth - this.hingeWidth*2 - this.middleConnectorWidth/2;


    this.amplitude = Math.sqrt((this.width/2-this.wallWidth-this.middleConnectorWidth)**2 - this.memberWidth**2);
    /*Note for construction
    left wall starts at x=0, right wall ends at x=this.width=2
    top starts at y=0, bottom ends at y=-1
    */
    
    this.texture = new texture(options);
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

    //var geo = mapping[this.type]();
    var geo = this.texture.getGeometry();
    var fill = this.texture.getFillGeometry();
    //fill.translate(-this.width / 2, 0, 0);
    geo.merge(fill);
    geo.merge(this.texture._getWallGeometry('left'));
    geo.merge(this.texture._getWallGeometry('right'));
    geo.translate(-0.5, 0.5, 0);
    return geo;
  }



  return Texture;

})();
