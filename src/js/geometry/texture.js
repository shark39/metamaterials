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
- ...

*/

const THREE = require('three');
const ThreeBSP = require('three-js-csg')(THREE);

const bind = require('../misc/bind');
const VoxelElement = require('./voxel_element');

module.exports = (function() {


  //Helpers (should be moved to an external file)
  var PrismGeometry = function(vertices, height) {

    var Shape = new THREE.Shape();

    (function f(ctx) {

      ctx.moveTo(vertices[0].x, vertices[0].y);
      for (var i = 1; i < vertices.length; i++) {
        ctx.lineTo(vertices[i].x, vertices[i].y);
      }
      ctx.lineTo(vertices[0].x, vertices[0].y);

    })(Shape);

    var settings = {};
    settings.amount = height;
    settings.bevelEnabled = false;
    THREE.ExtrudeGeometry.call(this, Shape, settings);

  };

  PrismGeometry.prototype = Object.create(THREE.ExtrudeGeometry.prototype);


  function mirror(geometry) {
    var mirroredGeometry = geometry.clone();
    var mS = (new THREE.Matrix4()).identity();
    mS.elements[0] = -1;
    mirroredGeometry.applyMatrix(mS);
    return mirroredGeometry;
  }

  function flipNormals(geometry) {
    for (var i = 0; i < geometry.faces.length; i++) {

      var face = geometry.faces[i];
      var temp = face.a;
      face.a = face.c;
      face.c = temp;

    }

    geometry.computeFaceNormals();
    geometry.computeVertexNormals();

    var faceVertexUvs = geometry.faceVertexUvs[0];
    for (var i = 0; i < faceVertexUvs.length; i++) {

      var temp = faceVertexUvs[i][0];
      faceVertexUvs[i][0] = faceVertexUvs[i][2];
      faceVertexUvs[i][2] = temp;

    }

  }
  //end helpers

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
    this.hingeWidth = options.hingeWidth || 0.04;
    this.hingeHeight = options.hingeHeight || 0.1;
    this.memberHeight = options.memberHeight || 0.2;
  }

  ///////////////////////////////////////////////////
  //HELPER FUNCTIONS TO CONSTRUCT THE TEXTURECELL //
  /////////////////////////////////////////////////
  Texture.prototype._getSurfaceGeometry = function() {
    var topPlane = new THREE.BoxGeometry(this.width, this.surfaceHeight, this.length, 4, 4, 4);
    topPlane.translate(-this.width / 2, -this.surfaceHeight / 2, 0);
    return topPlane;
  }

  Texture.prototype._getMemberGeometry = function(orientation) {
    orientation = orientation / Math.abs(orientation) || 1;
    var A = new THREE.Vector2(0, 0);
    var B = new THREE.Vector2(orientation * (this.width / 2 - 2 * this.hingeWidth - this.wallWidth - this.middleConnectorWidth / 2), this.memberHeight);
    var C = new THREE.Vector2(0, this.memberHeight);

    var member = new PrismGeometry([A, B, C], this.length);
    member.translate(-this.middleConnectorWidth / 2 - this.hingeWidth - B.x, -this.memberHeight - this.surfaceHeight, -this.length / 2);
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

  //different geometry types:
  Texture.prototype.getGeometry = function(pattern) {
    const mapping = {
      'regular': this.getRegularGeometry,
      'zigzag': this.getZigZagGeometry,
      'box': this.getBoxGeometry
    };
    var geo = mapping[pattern]();
    var fill = this.getFillGeometry();
    fill.translate(-this.width / 2, 0, 0);
    THREE.GeometryUtils.merge(geo, fill);
    return geo;
  }

  Texture.prototype.getGeometry2 = function() {
    //
    var textureGeometry = new THREE.Geometry();

    //generate left half of the texture cell
    var middleConnector = new THREE.BoxGeometry(this.middleConnectorWidth / 2, this.height, this.length, 4, 4, 4);
    middleConnector.translate(-this.middleConnectorWidth / 4, -this.height / 2, 0);
    THREE.GeometryUtils.merge(textureGeometry, middleConnector);

    THREE.GeometryUtils.merge(textureGeometry, this._getSurfaceGeometry());

    var wall = new THREE.BoxGeometry(this.wallWidth, this.height, this.length, 4, 4, 4);
    wall.translate(-this.width / 2 + this.wallWidth / 2, -this.height / 2, 0);
    THREE.GeometryUtils.merge(textureGeometry, wall);

    //member
    THREE.GeometryUtils.merge(textureGeometry, this._getMemberGeometry());

    //the lower part of the cell
    var lowerPlane = this._getSurfaceGeometry();
    lowerPlane.translate(0, -this._getDistanceBetweenMembers(), 0);
    THREE.GeometryUtils.merge(textureGeometry, lowerPlane);

    var lowerMember = this._getMemberGeometry();
    lowerMember.translate(0, -this._getDistanceBetweenMembers(), 0);

    THREE.GeometryUtils.merge(textureGeometry, lowerMember);


    var textureRight = mirror(textureGeometry);
    textureRight.computeFaceNormals();
    textureRight.computeVertexNormals();
    //flip normals for the shader
    //flipNormals(textureRight);

    THREE.GeometryUtils.merge(textureGeometry, textureRight);
    //textureGeometry.computeFaceNormals();
    //textureGeometry.computeVertexNormals();

    //textureGeometry.computeBoundingBox();
    //console.log(textureGeometry.boundingBox);
    return textureGeometry;
  }

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
    var textureGeometry = new THREE.Geometry();

    //generate left half of the texture cell
    console.log(this._getDistanceBetweenMembers());
    var middleConnector = new THREE.BoxGeometry(this.middleConnectorWidth, this._getDistanceBetweenMembers(), this.length, 4, 4, 4);
    middleConnector.translate(-this.middleConnectorWidth / 2 - 1, -this._getDistanceBetweenMembers() / 2, 0);
    THREE.GeometryUtils.merge(textureGeometry, middleConnector);

    THREE.GeometryUtils.merge(textureGeometry, this._getSurfaceGeometry());
    THREE.GeometryUtils.merge(textureGeometry, this._getWallGeometry('left'));
    THREE.GeometryUtils.merge(textureGeometry, this._getWallGeometry('right'));

    return textureGeometry;

  }

  Texture.prototype.getZigZagGeometry = function() {

    var textureGeometry = new THREE.Geometry();

    var middleConnector = this._getMiddleZigZagGeometry();
    middleConnector.translate(-1 - 0.15 - 0.15 / 2, -this._getDistanceBetweenMembers(), 0);
    THREE.GeometryUtils.merge(textureGeometry, middleConnector);

    var topPlane = new THREE.BoxGeometry(this.width, this.surfaceHeight, this.length, 4, 4, 4);

    this.zigzagGap = this.width / 16;
    var negativ = new THREE.BoxGeometry(this.zigzagGap, this.surfaceHeight, Math.sqrt((this.length * 2) ** 2 + this.width ** 2));
    negativ.rotateY(Math.sin(2));
    //negativ.translate(-this.width/8, 0, 0);
    var topPlaneBSP = new ThreeBSP(topPlane);
    var negativBSP = new ThreeBSP(negativ);
    var result = topPlaneBSP.subtract(negativBSP);
    topPlane = result.toMesh().geometry;
    topPlane.translate(-this.width / 2, -this.surfaceHeight / 2, 0);
    THREE.GeometryUtils.merge(textureGeometry, topPlane);

    var wall = new THREE.BoxGeometry(this.wallWidth, this.height, this.length, 4, 4, 4);
    wall.translate(-this.wallWidth / 2, -this.height / 2, 0);
    THREE.GeometryUtils.merge(textureGeometry, wall);

    var wall2 = new THREE.BoxGeometry(this.wallWidth, this.height, this.length, 4, 4, 4);
    wall2.translate(-this.wallWidth / 2 - this.width, -this.height / 2, 0);
    THREE.GeometryUtils.merge(textureGeometry, wall2);

    var fill = this.getFillGeometry();
    fill.translate(-this.width / 2, 0, 0);
    THREE.GeometryUtils.merge(textureGeometry, fill);

    return textureGeometry;
  }

  Texture.prototype.getBoxGeometry = function() {

    var textureGeometry = new THREE.Geometry();

    var middleConnector = this._getMiddleBoxGeometry();
    middleConnector.translate(-1 - 0.15 - 0.15 / 2, -this._getDistanceBetweenMembers(), -this.length/2);

    THREE.GeometryUtils.merge(textureGeometry, middleConnector);

    THREE.GeometryUtils.merge(textureGeometry, this._getSurfaceGeometry());
    THREE.GeometryUtils.merge(textureGeometry, this._getWallGeometry('left'));
    THREE.GeometryUtils.merge(textureGeometry, this._getWallGeometry('right'));

    return textureGeometry;

  }


  /*const box = new THREE.Mesh(this.getGeometry());
    const box2 = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const box2Mesh = new THREE.Mesh(box2);

    const sBSP = new ThreeBSP(box2Mesh);
    const bBSP = new ThreeBSP(box);

    const sub = bBSP.subtract(sBSP);
    const newMesh = sub.toMesh();
    return newMesh.geometry;
*/


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
