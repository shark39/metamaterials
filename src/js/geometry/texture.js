'use strict';

const THREE = require('three');

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

  Texture.prototype.getGeometry = function() {
    

    var textureGeometry = new THREE.Geometry();

    //generate left half of the texture cell
    var middleConnector = new THREE.BoxGeometry(this.middleConnectorWidth/2, this.height, this.length, 4, 4, 4);
    middleConnector.translate(-this.middleConnectorWidth/4, -this.height/2, 0);
    THREE.GeometryUtils.merge(textureGeometry, middleConnector);

    var topPlane = new THREE.BoxGeometry(this.width/2, this.surfaceHeight, this.length, 4, 4, 4);
    topPlane.translate(-this.width / 4, -this.surfaceHeight / 2, 0);
    THREE.GeometryUtils.merge(textureGeometry, topPlane);

    var wall = new THREE.BoxGeometry(this.wallWidth, this.height, this.length, 4, 4, 4);
    wall.translate(-this.width / 2 + this.wallWidth/2, -this.height / 2, 0);
    THREE.GeometryUtils.merge(textureGeometry, wall);

    //member
    var A = new THREE.Vector2(0, 0);
    var B = new THREE.Vector2(this.width / 2 - 2 * this.hingeWidth - this.wallWidth - this.middleConnectorWidth/2, this.memberHeight);
    var C = new THREE.Vector2(0, this.memberHeight);

    var member = new PrismGeometry([A, B, C], this.length);
    member.translate(-this.middleConnectorWidth/2-this.hingeWidth-B.x, -this.memberHeight - this.surfaceHeight, -this.length / 2);

    THREE.GeometryUtils.merge(textureGeometry, member);

    //the lower part of the cell
    var lowerPlane = topPlane.clone();
    lowerPlane.translate(0, -A.distanceTo(B), 0);
    THREE.GeometryUtils.merge(textureGeometry, lowerPlane);

    var lowerMember = member.clone();
    lowerMember.translate(0, -A.distanceTo(B), 0);

    THREE.GeometryUtils.merge(textureGeometry, lowerMember);


    var textureRight = mirror(textureGeometry);
    textureRight.computeFaceNormals();
    textureRight.computeVertexNormals();
    //flip normals for the shader
    //flipNormals(textureRight);

    THREE.GeometryUtils.merge(textureGeometry, textureRight);


    //textureGeometry.computeBoundingBox();
    //console.log(textureGeometry.boundingBox);
    return textureGeometry;
  }

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
