'use strict';

/*
A Regular Texture cell
*/

const bind = require('../../misc/bind');
const Texture = require('./metatexture');
const THREE = require('three');


module.exports = (function() {

  function TextureRegular() {
    //bind(this);
    Texture.call(this);
    //this.texture = texture;
    this.name = "regular";
  }

  TextureRegular.prototype = Object.create(Texture.prototype);
  TextureRegular.getName = () => "regular";
  TextureRegular.getIsCustomizable = () => true;
  TextureRegular.getDrawing = function() {
    return [[0.5, 0], [0.5, 1]];
  }

  TextureRegular.prototype.getGeometry = function() {
    var textureGeometry = new THREE.Geometry();

    var middleConnector = new THREE.BoxGeometry(this.middleConnectorWidth, this.height, this.length);
    middleConnector.translate(this.width/2, -(this.height)/2, 0);
    textureGeometry.merge(middleConnector);

    var member1 = this._getMemberGeometry(1, false);
    member1.translate(this.wallWidth + this.hingeWidth, -this.memberHeight-this.surfaceHeight, -this.length/2);
    textureGeometry.merge(member1);

    var member2 = this._getMemberGeometry(-1, false);
    member2.translate(this.width/2 + this.middleConnectorWidth/2 + this.hingeWidth + this.memberWidth, -this.memberHeight-this.surfaceHeight, -this.length/2);
    textureGeometry.merge(member2);

    textureGeometry.merge(this._getSurfaceGeometry());

    return textureGeometry;
  }


  return TextureRegular;

})();
