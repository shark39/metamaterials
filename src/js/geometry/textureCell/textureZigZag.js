'use strict';

/*
A Regular Texture cell
*/

const bind = require('../../misc/bind');
const Texture = require('./metatexture');
const THREE = require('three');
const ThreeBSP = require('three-js-csg')(THREE);

const PrismGeometry = require('./prism.js');

module.exports = (function() {

  function TextureZigZag() {
    //bind(this);
    Texture.call(this);
    //this.texture = texture;
    this.name = "zigzag";
    this.isCustomizable = false;
  }

  TextureZigZag.prototype = Object.create(Texture.prototype);

  TextureZigZag.getName = () => "zigzag";
  TextureZigZag.getIsCustomizable = () => true;
  TextureZigZag.getDrawing = function() {
    return [[0.1, 0.1], [0.9, 0.9]];
  }

  TextureZigZag.prototype.getGeometry = function() {
    //diagonal gap, thinner surface on top

    var textureGeometry = new THREE.Geometry();

    var middleConnector = this._getMiddleZigZagGeometry();
    middleConnector.computeBoundingBox();
    middleConnector.translate(this.width/2-middleConnector.boundingBox.max.x/2, -middleConnector.boundingBox.max.y-this.surfaceHeight, 0);
    textureGeometry.merge(middleConnector);

    var topPlane = new THREE.BoxGeometry(this.width, this.surfaceHeight, this.length);

    this.zigzagGap = this.width / 16;
    var negativ = new THREE.BoxGeometry(this.zigzagGap, this.surfaceHeight*2, Math.sqrt((this.length * 2) ** 2 + this.width ** 2));
    negativ.rotateZ(Math.PI/4);
    negativ.rotateY(Math.sin(1.4));
    negativ.translate(0, -0.08, 0);
    var topPlaneBSP = new ThreeBSP(topPlane);
    var negativBSP = new ThreeBSP(negativ);
    var result = topPlaneBSP.subtract(negativBSP);
    topPlane = result.toMesh().geometry;
    topPlane.translate(this.width / 2, -this.surfaceHeight / 2, 0);
    textureGeometry.merge(topPlane);

    return textureGeometry;
  }

  TextureZigZag.prototype._getMiddleZigZagGeometry = function() {
    var A = new THREE.Vector2(-0.5, 0);
    var B = new THREE.Vector2(-0.15, this.amplitude);
    //var p = this.width / 2 - 2 * this.hingeWidth - this.wallWidth - this.middleConnectorWidth / 2;
    var C = new THREE.Vector2(0.15, this.amplitude);
    var D = new THREE.Vector2(0.5, 0);

    var m = new PrismGeometry([A, B, C, D], 0.2);
    m.rotateY(Math.PI / 2);
    //member.translate(-this.middleConnectorWidth / 2 - this.hingeWidth - B.x, -this.memberHeight - this.surfaceHeight, -this.length / 2);
    return m;
  }


  return TextureZigZag;

})();
