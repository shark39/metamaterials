'use strict';

/*
A Regular Texture cell
*/

const bind = require('../../misc/bind');
const Texture = require('./metatexture');
const THREE = require('three');


module.exports = (function() {

  function TextureRound() {
    //bind(this);
    Texture.call(this);
    //this.texture = texture;
    this.name = "round";
    this.isCustomizable = false;
  }

  TextureRound.prototype = Object.create(Texture.prototype);

  TextureRound.getName = () => "round";
  TextureRound.getIsCustomizable = () => false;
  TextureRound.getDrawing = function() {
    return [[0.3, 0], [0.7, 0], [0.7, 1], [0.3, 1], [0.3, 0]];

  }

  TextureRound.prototype.getGeometry = function() {
    var textureGeometry = new THREE.Geometry();

    var middleConnector = new THREE.BoxGeometry(this.middleConnectorWidth, this.amplitude, this.length);
    middleConnector.translate(this.width/2, -this.amplitude / 2, 0);
    textureGeometry.merge(middleConnector);

    var memberWidth = this.memberWidth - 0.3/2;
    var member1 = this._getMemberGeometry(1, false, {memberWidth: memberWidth});
    member1.translate(this.wallWidth + this.hingeWidth, -this.memberHeight-this.surfaceHeight, -this.length/2);
    textureGeometry.merge(member1);

    var member2 = this._getMemberGeometry(-1, false, {memberWidth});
    member2.translate(this.width/2 + this.middleConnectorWidth/2 + this.hingeWidth + this.memberWidth, -this.memberHeight-this.surfaceHeight, -this.length/2);
    textureGeometry.merge(member2);

    textureGeometry.merge(this._getSurfaceGeometry());

    return textureGeometry;
  }


  return TextureRound;

})();
