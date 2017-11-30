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

const bind = require('../misc/bind');
const VoxelElement = require('./voxel_element');
const PrismGeometry = require('./prism.js');


module.exports = (function() {

  function Texture(options) {
    /*options contains parameters like length, hingeThickness ...*/
    bind(this);
    var options = options != undefined ? options : {};
    //VoxelElement.call(this, vertices, buffer);
    this.length = options.length || 1;
    this.height = options.height || 1;
    this.width = options.width || 2;
    this.wallWidth = options.wallWidth || 0.3;
    this.middleConnectorWidth = options.middleConnectorWidth || 0.2;
    this.surfaceHeight = options.surfaceHeight || 0.1;
    this.hingeWidth = options.hingeWidth || 0.08;
    this.hingeHeight = options.hingeHeight || 0.1;
    this.memberHeight = options.memberHeight || 0.2;

    //calculate width of member (wallWidth/2 because half of wall is outside of the voxel)
    this.memberWidth = this.width/2 - this.wallWidth/2 - this.hingeWidth*2 - this.middleConnectorWidth/2;
  }

  //different geometry types:
  Texture.prototype.getGeometry = function(pattern) {
    const mapping = {
      'regular': this.getRegularGeometry,
      'zigzag': this.getZigZagGeometry,
      'spiky': this.getSpikyGeometry,
      'box': this.getBoxGeometry,
      'round': this.getRoundGeometry
    };
    var geo = mapping[pattern]();
    var fill = this.getFillGeometry();
    fill.translate(-this.width / 2, 0, 0);
    THREE.GeometryUtils.merge(geo, fill);
    THREE.GeometryUtils.merge(geo, this._getWallGeometry('left'));
    THREE.GeometryUtils.merge(geo, this._getWallGeometry('right'));
    return geo;
  }

  ///////////////////////////////////////////////////
  //HELPER FUNCTIONS TO CONSTRUCT THE TEXTURECELL //
  /////////////////////////////////////////////////
  Texture.prototype._getSurfaceGeometry = function() {
    var topPlane = new THREE.BoxGeometry(this.width, this.surfaceHeight, this.length, 4, 4, 4);
    topPlane.translate(-this.width / 2, -this.surfaceHeight / 2, 0);
    return topPlane;
  }

  Texture.prototype._getMemberGeometry = function(orientation, doTranslate) {
    //return prism geometry
    orientation = orientation / Math.abs(orientation) || 1;
    var A = new THREE.Vector2(0, 0);
    var B = new THREE.Vector2(orientation * this.memberWidth, this.memberHeight);
    var C = new THREE.Vector2(0, this.memberHeight);

    var member = new PrismGeometry([A, B, C], this.length);
    if (doTranslate == undefined || doTranslate) {
      member.translate(-this.middleConnectorWidth / 2 - this.hingeWidth - B.x, -this.memberHeight - this.surfaceHeight, -this.length / 2);
    }
    return member;

  }

  Texture.prototype._getMiddleZigZagGeometry = function() {
    var A = new THREE.Vector2(-0.5, 0);
    var B = new THREE.Vector2(-0.15, this._getDistanceBetweenMembers());
    var p = this.width / 2 - 2 * this.hingeWidth - this.wallWidth - this.middleConnectorWidth / 2;
    var C = new THREE.Vector2(0.15, this._getDistanceBetweenMembers());
    var D = new THREE.Vector2(0.5, 0);


    var m = new PrismGeometry([A, B, C, D], 0.2);
    m.rotateY(Math.PI / 2);
    //member.translate(-this.middleConnectorWidth / 2 - this.hingeWidth - B.x, -this.memberHeight - this.surfaceHeight, -this.length / 2);
    return m;
  }

  Texture.prototype._getMiddleBoxGeometry = function() {
    var A = new THREE.Vector2(-0.5, 0);
    var B = new THREE.Vector2(-0.15, this._getDistanceBetweenMembers());
    var C = new THREE.Vector2(0.15, this._getDistanceBetweenMembers());
    var D = new THREE.Vector2(0.5, 0);
    var m = new PrismGeometry([A, B, C, D], this.length);
    return m;
  }

  Texture.prototype._getMiddleConnector = function() {
    var middleConnector = new THREE.BoxGeometry(this.middleConnectorWidth / 2, this.height, this.length, 4, 4, 4);
    middleConnector.translate(-this.middleConnectorWidth / 4, -this.height / 2, 0);
    return middleConnector;
  }

  Texture.prototype._getWallGeometry = function(side) {
    var wall = new THREE.BoxGeometry(this.wallWidth, this.height, this.length, 4, 4, 4);
    wall.translate(-this.wallWidth / 2, -this.height / 2, 0);
    if (side == "left") {
      wall.translate(-this.width, 0, 0);
    }
    return wall;
  }

  Texture.prototype._getDistanceBetweenMembers = function() {
    var A = new THREE.Vector2(0, 0);
    var B = new THREE.Vector2(this.width / 2 - 2 * this.hingeWidth - this.wallWidth - this.middleConnectorWidth / 2, this.memberHeight);
    return A.distanceTo(B);
  }
  //END HELPERS


  Texture.prototype.getFillGeometry = function() {
    //returns the lower part of the texture cell without walls
    //dimensions are [this.width, this.height/2, this.length]
    // ################
    // x   #  #  #   x
    // x  #        # x
    // x#           #x
    var tempGeo = new THREE.Geometry();
    var topPlane = new THREE.BoxGeometry(this.width, this.surfaceHeight, this.length, 4, 4, 4);
    topPlane.translate(0, -this._getDistanceBetweenMembers(), 0)
    THREE.GeometryUtils.merge(tempGeo, topPlane);

    var lowerMember1 = this._getMemberGeometry();
    lowerMember1.translate(-this.middleConnectorWidth / 2 - this.hingeWidth, -this._getDistanceBetweenMembers() + 0.1, 0);
    THREE.GeometryUtils.merge(tempGeo, lowerMember1);

    var lowerMember2 = this._getMemberGeometry(-1);
    lowerMember2.translate(this.middleConnectorWidth / 2 + this.hingeWidth, -this._getDistanceBetweenMembers() + 0.1, 0);
    THREE.GeometryUtils.merge(tempGeo, lowerMember2);

    return tempGeo;
  }

  Texture.prototype.getRegularGeometry = function() {
    //regular texture pattern
    //surface + middleConnector + members

    var textureGeometry = new THREE.Geometry();

    var middleConnector = new THREE.BoxGeometry(this.middleConnectorWidth, this._getDistanceBetweenMembers(), this.length);
    middleConnector.translate(-this.middleConnectorWidth/2 -0.05  -this.width/2, -this._getDistanceBetweenMembers() / 2, 0);
    THREE.GeometryUtils.merge(textureGeometry, middleConnector);

    var member1 = this._getMemberGeometry(1, false);
    member1.translate(-this.width + this.hingeWidth, -this.memberHeight-this.surfaceHeight, -this.length/2);
    THREE.GeometryUtils.merge(textureGeometry, member1);

    var member2 = this._getMemberGeometry(-1, false);
    member2.translate(-this.wallWidth-this.hingeWidth, -this.memberHeight-this.surfaceHeight, -this.length/2);
    THREE.GeometryUtils.merge(textureGeometry, member2);

    THREE.GeometryUtils.merge(textureGeometry, this._getSurfaceGeometry());

    return textureGeometry;
  }

  Texture.prototype.getZigZagGeometry = function() {

    var textureGeometry = new THREE.Geometry();

    var middleConnector = this._getMiddleZigZagGeometry();
    middleConnector.translate(-1 - 0.15 - 0.15 / 2, -this._getDistanceBetweenMembers(), 0);
    THREE.GeometryUtils.merge(textureGeometry, middleConnector);

    var topPlane = new THREE.BoxGeometry(this.width, this.surfaceHeight, this.length, 4, 4, 4);

    this.zigzagGap = this.width / 16;
    var negativ = new THREE.BoxGeometry(this.zigzagGap, this.surfaceHeight*2, Math.sqrt((this.length * 2) ** 2 + this.width ** 2));
    negativ.rotateZ(Math.PI/4);
    negativ.rotateY(Math.sin(1.4));
    //negativ.translate(0, -0.05, 0);
    var topPlaneBSP = new ThreeBSP(topPlane);
    var negativBSP = new ThreeBSP(negativ);
    var result = topPlaneBSP.subtract(negativBSP);
    topPlane = result.toMesh().geometry;
    topPlane.translate(-this.width / 2, -this.surfaceHeight / 2, 0);
    THREE.GeometryUtils.merge(textureGeometry, topPlane);

    return textureGeometry;
  }

  Texture.prototype.getSpikyGeometry = function() {

    var textureGeometry = new THREE.Geometry();

    var middleConnector = this._getMiddleZigZagGeometry();
    middleConnector.translate(-1 - 0.15 - 0.15 / 2, -this._getDistanceBetweenMembers(), 0);
    THREE.GeometryUtils.merge(textureGeometry, middleConnector);

    var topPlane = new THREE.BoxGeometry(this.width, this.surfaceHeight, this.length, 4, 4, 4);

    this.zigzagGap = this.width / 16;
    var negativ = new THREE.BoxGeometry(this.zigzagGap, this.surfaceHeight*2, Math.sqrt((this.length * 2) ** 2 + this.width ** 2));
    negativ.rotateZ(Math.PI/4);
    negativ.rotateY(Math.sin(1.4));
    //negativ.translate(0, -0.05, 0);
    var topPlaneBSP = new ThreeBSP(topPlane);
    var negativBSP = new ThreeBSP(negativ);
    var result = topPlaneBSP.subtract(negativBSP);
    topPlane = result.toMesh().geometry;
    topPlane.translate(-this.width / 2, -this.surfaceHeight / 2, 0);
    THREE.GeometryUtils.merge(textureGeometry, topPlane);

    THREE.GeometryUtils.merge(textureGeometry, fill);

    return textureGeometry;
  }

  Texture.prototype.getBoxGeometry = function() {

    var textureGeometry = new THREE.Geometry();

    var middleConnector = this._getMiddleBoxGeometry();
    middleConnector.translate(-1 - 0.15 - 0.15 / 2, -this._getDistanceBetweenMembers(), -this.length/2);

    THREE.GeometryUtils.merge(textureGeometry, middleConnector);

    var member1 = this._getMemberGeometry();
    member1.translate(-this.middleConnectorWidth / 2 - this.hingeWidth - this.width/2, 0, 0);
    THREE.GeometryUtils.merge(textureGeometry, member1);

    var member2 = this._getMemberGeometry(-1);
    member2.translate(this.middleConnectorWidth / 2 + this.hingeWidth - this.width/2, 0, 0);
    THREE.GeometryUtils.merge(textureGeometry, member2);

    THREE.GeometryUtils.merge(textureGeometry, this._getSurfaceGeometry());

    return textureGeometry;

  }

  Texture.prototype.getRoundGeometry = function() {
    //other members

    var textureGeometry = new THREE.Geometry();

    var middleConnector = new THREE.BoxGeometry(this.middleConnectorWidth, this._getDistanceBetweenMembers(), this.length, 4, 4, 4);
    middleConnector.translate(-this.middleConnectorWidth / 2 - 1, -this._getDistanceBetweenMembers() / 2, 0);
    THREE.GeometryUtils.merge(textureGeometry, middleConnector);

    var outerHingeWidth = this.hingeWidth;
    this.hingeWidth = this.hingeWidth * 4;
    var member2 = this._getMemberGeometry(-1, false);
    var member1 = this._getMemberGeometry(1, false);
    this.hingeWidth = outerHingeWidth;
    member1.translate(-this.middleConnectorWidth / 2 - this.hingeWidth*4 - this.width/2, 0, 0);
    THREE.GeometryUtils.merge(textureGeometry, member1);

    member2.translate(- this.hingeWidth - this.wallWidth -0.2, 0, 0);
    THREE.GeometryUtils.merge(textureGeometry, member2);

    THREE.GeometryUtils.merge(textureGeometry, this._getSurfaceGeometry());

    return textureGeometry;
  }


  /////////////////////////



  /*  Texture.Texture = { element: Texture, vertices: [ 0, 1, 2, 3, 4, 5, 6, 7 ], id: 's' };


    Texture.prototype.positionMatrix = function(thickness) {  }

    Texture.prototype.offsetMatrix = function() {
      return new THREE.Matrix4();
    }

    Texture.prototype.localEdges = function() {
      return [];
    }*/

  return Texture;

})();
