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
const Voxel = require('../voxel');
const merge = require('./merge');
const PrismGeometry = require('./prism');
const BentTexture = require('./bentTexture');

class Texture extends Voxel {
  constructor(position, options = {}) {
    super(position, options);

    if (options.bent) {
      let derrivedClass = BentTexture(this.constructor);
      return new derrivedClass(position, options);
    }

    /* position is just stored not used
    /* texture is an instance that implements a .getGeometry() function
    /* stiffness = [0;1]
    /* orientation is Vector3 with -1, 0, 1 depending on the orientation
    /*options contains parameters like length, hingeThickness ...*/

    let defaultOptions = {
      stiffness: 0.1,
      orientation: new THREE.Vector3(0, 1, 0), //y
      length: 1,
      height: 1,
      width: 2,
      wallWidth: 0.2,
      middleConnectorWidth: 0.2,
      surfaceHeight: 0.1,
      hingeWidth: 0.08,
      memberHeight: 0.3,
      onlySupport: false,
      fullMiddleConnector: false,
      hingeHeight: 0.1 + this.stiffness / 4 //this is just for visualisation
    };

    if (options.relativeExtrusion !== undefined) {
      defaultOptions.onlySupport = options.relativeExtrusion !== 1;
      defaultOptions.fullMiddleConnector = options.relativeExtrusion !== 0;
      delete options.relativeExtrusion;
    }
    if (options.hingeHeight !== undefined) {
      console.warn("overwrite hingeHeight");
    }

    for (let option in defaultOptions) {
      this[option] = options[option] = options[option] || defaultOptions[option];
    }

    this.options = options;

    //calculate width of member
    this.memberWidth = this.width / 2 - this.wallWidth - this.hingeWidth * 2 - this.middleConnectorWidth / 2;

    this.amplitude = Math.sqrt((this.width / 2 - this.wallWidth - this.middleConnectorWidth) ** 2 - this.memberWidth ** 2);

    this.cellCount = options.cellCount || this.cells();

    /*Note for construction
    left wall starts at x=0, right wall ends at x=this.width=2
    top starts at y=0, bottom ends at y=-1
    */
  }

  cacheKey() {
    return super.cacheKey() + this.textureType();
  }

  size() {
    switch (this.orientation.largestComponent()) {
      case 0:
        return [1 * this.cellCount, 1, 2];
      case 1:
        return [2, 1, 1 * this.cellCount];
      case 2:
        return [2, 1, 1 * this.cellCount];
    }
  }

  type() {
    return "texture"
  }

  textureType() {
    throw "abstract method";
  }

  inner() {
    throw "abstract method";
  }

  merge(a, b) {
    return merge(a, b);
  };

  setMinThickness() {} //TODO

  color() {
    let color = new THREE.Color(this.orientation.x !== 0 ? 1 : 0, this.orientation.y !== 0 ? 1 : 0, this.orientation.z !== 0 ? 1 : 0);
    let l = 1 - (0.8 * this.stiffness + 0.1); // from 0.1 to 0.9
    let hue = (color.getHSL()).h;
    color.setHSL(hue, 1.0, l);
    return color;
  }


  //different geometry types:
  _buildGeometry() {
    let geometries = [
      this.fill(),
      this.wall('left'),
      this.wall('right'),
    ];

    if (this.onlySupport) {
      geometries.push(this.middleConnector());
    } else {
      geometries.push(this.inner());
    }

    var geo = geometries.reduce((sum, geo) => merge(sum, geo), new THREE.Geometry());
    geo.translate(-0.5, 0.5, 0);
    let lc = this.orientation.largestComponent();
    let neg = this.orientation.getComponent(lc) < 0;
    switch (this.orientation.largestComponent()) {
      case 0:
        geo.rotateZ(-Math.PI / 2 + neg * Math.PI);
        geo.rotateX(-Math.PI / 2);
        if (neg) geo.translate(0, 0, 1);
        break;
      case 1:
        if (!neg) break;
        geo.rotateX(Math.PI);
        break;
      case 2:
        geo.rotateX(Math.PI / 2 + neg * Math.PI);
        break;
    }
    return geo;
  }

  wall(side) {
    var wall = new THREE.BoxGeometry(this.wallWidth, this.height, this.length);
    wall.translate(
      this.wallWidth / 2 + (side == "right" ? this.width - this.wallWidth : 0), -this.height / 2,
      0);
    return wall;
  }

  middleConnector() {
    let height = this.fullMiddleConnector ? this.height : this.height - this.surfaceHeight;
    var middleConnector = new THREE.BoxGeometry(this.middleConnectorWidth, height, this.length);
    middleConnector.translate(this.width / 2, -height / 2, 0);
    return middleConnector;
  }

  member(orientation, doTranslate, options) {
    //return prism geometry
    var memberHeight = !!options ? options.memberHeight || this.memberHeight : this.memberHeight;
    var memberWidth = !!options ? options.memberWidth || this.memberWidth : this.memberWidth;
    orientation = orientation / Math.abs(orientation) || 1;
    var A = new THREE.Vector2(0, 0);
    var B = new THREE.Vector2(orientation * memberWidth, memberHeight);
    var C = new THREE.Vector2(0, memberHeight);

    var member = new PrismGeometry([A, B, C], this.length);
    if (doTranslate == undefined || doTranslate) {
      member.translate(-this.middleConnectorWidth / 2 - this.hingeWidth - B.x, -memberHeight - this.surfaceHeight, -this.length / 2);
    }
    return member;
  }

  surface() {
    //TODO two parts, leave out the hinges
    var topPlane = new THREE.BoxGeometry(this.width, this.surfaceHeight, this.length);
    topPlane.translate(this.width / 2, -this.surfaceHeight / 2, 0);
    return topPlane;
  }

  fill() {
    //returns the lower part of the texture cell without walls
    //dimensions are [this.width, this.height/2, this.length]
    // ################
    // x   #  #  #   x
    // x  #        # x
    // x#           #x
    var memberHeight = this.amplitude - this.surfaceHeight;
    var tempGeo = new THREE.Geometry();
    var topPlane = new THREE.BoxGeometry(this.width, this.surfaceHeight, this.length);
    topPlane.translate(this.width / 2, memberHeight + this.surfaceHeight / 2, this.length / 2);
    tempGeo = this.merge(tempGeo, topPlane);

    var lowerMember1 = this.member(1, false, {
      memberHeight: memberHeight
    });
    lowerMember1.translate(this.wallWidth + this.hingeWidth, 0, 0);
    tempGeo = this.merge(tempGeo, lowerMember1);

    var lowerMember2 = this.member(-1, false, {
      memberHeight: memberHeight
    });
    lowerMember2.translate(this.width / 2 + this.middleConnectorWidth / 2 + this.hingeWidth + this.memberWidth, 0, 0);
    tempGeo = this.merge(tempGeo, lowerMember2);
    tempGeo.translate(0, -this.height, -this.length / 2);

    return tempGeo;
  }
}

module.exports = Texture;
