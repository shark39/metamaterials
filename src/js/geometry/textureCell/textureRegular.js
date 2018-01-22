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
    textureGeometry = this.merge(textureGeometry, middleConnector);

    var member1 = this._getMemberGeometry(1, false);
    member1.translate(this.wallWidth + this.hingeWidth, -this.memberHeight-this.surfaceHeight, -this.length/2);
    textureGeometry = this.merge(textureGeometry, member1);

    var member2 = this._getMemberGeometry(-1, false);
    member2.translate(this.width/2 + this.middleConnectorWidth/2 + this.hingeWidth + this.memberWidth, -this.memberHeight-this.surfaceHeight, -this.length/2);
    textureGeometry = this.merge(textureGeometry, member2);

    textureGeometry = this.merge(textureGeometry, this._getSurfaceGeometry());

    //hinges
    var hingeOffsets = [this.wallWidth,
                        this.memberWidth,
                        this.middleConnectorWidth,
                        this.memberWidth
                     ]
    var offset = 0;
    for (var i = 0; i < hingeOffsets.length; i++) {
      offset += hingeOffsets[i];
      var box = new THREE.BoxGeometry(this.hingeWidth, this.hingeHeight, this.length);
      box.translate(this.hingeWidth/2+i*this.hingeWidth + offset, -this.hingeHeight/2, 0);
      textureGeometry = this.merge(textureGeometry, box);
    }

    return textureGeometry;
  }


  return TextureRegular;

})();
