'use strict';

const THREE = require('three');
const ThreeBSP = require('three-js-csg')(THREE);

const bind = require('../misc/bind');
const VoxelElement = require('./voxel_element');

module.exports = (function() {

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
  Texture.prototype._getSurfaceGeometry = function(splitParts) {
    //split surface in x parts (useful for mirroring)
    splitParts = splitParts || 2;
    var topPlane = new THREE.BoxGeometry(this.width / splitParts, this.surfaceHeight, this.length, 4, 4, 4);
    topPlane.translate(-this.width / (splitParts), -this.surfaceHeight / 2, 0);
    return topPlane;
  }

  Texture.prototype._getMemberGeometry = function() {
    var A = new THREE.Vector2(0, 0);
    var B = new THREE.Vector2(this.width / 2 - 2 * this.hingeWidth - this.wallWidth - this.middleConnectorWidth / 2, this.memberHeight);
    var C = new THREE.Vector2(0, this.memberHeight);

    var member = new PrismGeometry([A, B, C], this.length);
    member.translate(-this.middleConnectorWidth / 2 - this.hingeWidth - B.x, -this.memberHeight - this.surfaceHeight, -this.length / 2);
    return member;

  }

  Texture.prototype._getMemberZigZagGeometry = function() {
    var A = new THREE.Vector2(-0.5, 0);
    var B = new THREE.Vector2(-0.15, this.memberHeight);
    var p = this.width / 2 - 2 * this.hingeWidth - this.wallWidth - this.middleConnectorWidth / 2;
    var C = new THREE.Vector2(0.15, this.memberHeight);
    var D = new THREE.Vector2(0.5, 0);
    debugger;

    var member = new PrismGeometry([A, B, C, D], 0.2);
    member.rotateY(Math.PI/2);
    //member.translate(-this.middleConnectorWidth / 2 - this.hingeWidth - B.x, -this.memberHeight - this.surfaceHeight, -this.length / 2);
    return member;

  }

  Texture.prototype._getMiddleConnector = function() {
    var middleConnector = new THREE.BoxGeometry(this.middleConnectorWidth / 2, this.height, this.length, 4, 4, 4);
    middleConnector.translate(-this.middleConnectorWidth / 4, -this.height / 2, 0);
    return middleConnector;
  }

  Texture.prototype._getDistanceBetweenMembers = function() {
    var A = new THREE.Vector2(0, 0);
    var B = new THREE.Vector2(this.width / 2 - 2 * this.hingeWidth - this.wallWidth - this.middleConnectorWidth / 2, this.memberHeight);
    return A.distanceTo(B);
  }

  Texture.prototype.getGeometry = function() {


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

  Texture.prototype.getZigZagGeometry = function() {

    debugger;
    var textureGeometry = new THREE.Geometry();
    //generate left half of the texture cell
    //different!!! TODO
    var middleConnector = this._getMemberZigZagGeometry();
    middleConnector.translate(-1-0.15-0.15/2, -this.memberHeight, 0);
    THREE.GeometryUtils.merge(textureGeometry, middleConnector);

    var topPlane = new THREE.BoxGeometry(this.width, this.surfaceHeight, this.length, 4, 4, 4);

    this.zigzagGap = this.width/16;
    var negativ = new THREE.BoxGeometry(this.zigzagGap, this.surfaceHeight, Math.sqrt((this.length*2)**2 + this.width**2));
    negativ.rotateY(Math.sin(2));
    //negativ.translate(-this.width/8, 0, 0);
    var topPlaneBSP = new ThreeBSP(topPlane);
    var negativBSP = new ThreeBSP(negativ);
    var result = topPlaneBSP.subtract(negativBSP);
    topPlane = result.toMesh().geometry;
    topPlane.translate(-this.width/2, -this.surfaceHeight / 2, 0);

    THREE.GeometryUtils.merge(textureGeometry, topPlane);

    var wall = new THREE.BoxGeometry(this.wallWidth, this.height, this.length, 4, 4, 4);
    wall.translate(-this.wallWidth/2, -this.height / 2, 0);
    THREE.GeometryUtils.merge(textureGeometry, wall);

    var wall2 = new THREE.BoxGeometry(this.wallWidth, this.height, this.length, 4, 4, 4);
    wall2.translate(-this.wallWidth/2-this.width, -this.height / 2, 0);
    THREE.GeometryUtils.merge(textureGeometry, wall2);

    //member
    //THREE.GeometryUtils.merge(textureGeometry, this._getMemberGeometry());

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
