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

  function Texture() {
    bind(this);
    //VoxelElement.call(this, vertices, buffer);
  }

  Texture.prototype.getGeometry = function() {
    var length = 1;
    var height = 1;
    var boxWidth = 0.2;
    var wallWidth = 0.2;
    var middleWidth = 0.1;
    var boxHeight = 1;
    var totalWidth = 2;
    var topHeight = 0.05;
    var gap = 0.01; //hinge
    var memberHeight = 0.3;


    var textureGeometry = new THREE.Geometry();

    var middleConnector = new THREE.BoxGeometry(middleWidth / 2, boxHeight, length, 4, 4, 4);
    middleConnector.translate(0, -boxHeight / 2, 0);
    THREE.GeometryUtils.merge(textureGeometry, middleConnector);

    var topPlane = new THREE.BoxGeometry(totalWidth / 2, topHeight, length, 4, 4, 4);
    topPlane.translate(-totalWidth / 4, -topHeight / 2, 0);
    THREE.GeometryUtils.merge(textureGeometry, topPlane);

    var wall = new THREE.BoxGeometry(boxWidth, boxHeight, length, 4, 4, 4);
    wall.translate(-totalWidth / 2, -boxHeight / 2, 0);
    THREE.GeometryUtils.merge(textureGeometry, wall);

    //member
    var A = new THREE.Vector2(0, 0);
    var B = new THREE.Vector2(totalWidth / 2 - 2 * gap - 2 * boxWidth, memberHeight);
    var C = new THREE.Vector2(0, memberHeight);

    var height = length;
    var member = new PrismGeometry([A, B, C], height);
    member.translate(-totalWidth / 2 + wallWidth + gap, -memberHeight - topHeight, -length / 2);

    THREE.GeometryUtils.merge(textureGeometry, member);

    var middlePlane = topPlane.clone();
    middlePlane.translate(0, -height + memberHeight + topHeight / 2, 0);
    THREE.GeometryUtils.merge(textureGeometry, middlePlane);

    var middleMember = member.clone();
    middleMember.translate(0, -height + memberHeight + topHeight / 2, 0);

    THREE.GeometryUtils.merge(textureGeometry, middleMember);


    var cell2 = textureGeometry.clone();
    var mS = (new THREE.Matrix4()).identity();
    mS.elements[0] = -1;
    cell2.applyMatrix(mS);


    //flip normals for the shader
    for (var i = 0; i < cell2.faces.length; i++) {

      var face = cell2.faces[i];
      var temp = face.a;
      face.a = face.c;
      face.c = temp;

    }

    cell2.computeFaceNormals();
    cell2.computeVertexNormals();

    var faceVertexUvs = cell2.faceVertexUvs[0];
    for (var i = 0; i < faceVertexUvs.length; i++) {

      var temp = faceVertexUvs[i][0];
      faceVertexUvs[i][0] = faceVertexUvs[i][2];
      faceVertexUvs[i][2] = temp;

    }

    THREE.GeometryUtils.merge(textureGeometry, cell2);

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
