'use strict';

/*

*/
const bind = require('../../misc/bind');
const Texture = require('./texture');
const THREE = require('three');


module.exports = (function() {


  function TextureRegular() {
    //bind(this);
    Texture.call(this);
    this.name = "regular";
    this.isCustomizable = true;
  }

  TextureRegular.prototype = Object.create(Texture.prototype);
  return TextureRegular;

})();
