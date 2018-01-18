'use strict';

/*
A Regular Texture cell
*/

const bind = require('../../misc/bind');
const Texture = require('./metatexture');
const THREE = require('three');


module.exports = (function() {

  function TextureBox() {
    //bind(this);
    Texture.call(this);
    //this.texture = texture;
    this.name = "round";
    this.isCustomizable = false;
  }

  TextureBox.prototype = Object.create(Texture.prototype);

  TextureBox.getName = () => "box";
  TextureBox.getIsCustomizable = () => false;
  TextureBox.getDrawing = function() {
    return [[0.3, 0], [0.7, 0], [0.7, 1], [0.3, 1], [0.3, 0]];

  }

  TextureBox.prototype.getGeometry = function() {
    var textureGeometry = new THREE.Geometry();

    var middleConnector = this._getMiddleBoxGeometry(0.3, 0.5);
    middleConnector.translate(this.width/2, 0, -this.length/2);
    textureGeometry.merge(middleConnector);

    textureGeometry.merge(this.getMembersGeometry());
    textureGeometry.merge(this._getSurfaceGeometry());

    return textureGeometry;
  }


  return TextureBox;

})();
