'use strict';

/*
A Regular Texture cell
*/

const bind = require('../../misc/bind');
const Texture = require('./metatexture');
const THREE = require('three');


module.exports = (function() {

  function TextureSupport() {
    //bind(this);
    Texture.call(this);
    //this.texture = texture;
    this.name = "support";
    this.isCustomizable = false;
  }

  TextureSupport.prototype = Object.create(Texture.prototype);

  TextureSupport.getName = () => "support";
  TextureSupport.getIsCustomizable = () => false;
  TextureSupport.getDrawing = function() {
    return [];

  }

  TextureSupport.prototype.getGeometry = function() {
    var textureGeometry = new THREE.Geometry();

    return textureGeometry;
  }


  return TextureSupport;

})();
