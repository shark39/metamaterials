'use strict';

/*
A Regular Texture cell
*/

const bind = require('../../misc/bind');
const Texture = require('./metatexture');
const THREE = require('three');


module.exports = (function() {

  function TextureCustom() {
    //bind(this);
    Texture.call(this);
    //this.texture = texture;
    this.name = "custom";
  }

  TextureCustom.prototype = Object.create(Texture.prototype);
  TextureCustom.getName = () => "custom";
  TextureCustom.getIsCustomizable = () => true;
  TextureCustom.getDrawing = function() {
    return [];
  }

  TextureCustom.prototype.getGeometry = function() {
    //generate a negativ from the canvas path
    var height = this.surfaceHeight;
    var gap = 0.05;
    var path = new THREE.Curve();
    path.getPoint = function(t) {return canvasdrawer.getPoint(t);}; //this function ist required for extrude geometry

    var shapePoints2 = [ new THREE.Vector2(0, -gap),
                        new THREE.Vector2(0.3*height, -gap),
                        new THREE.Vector2(height, -gap*1.5),
                        new THREE.Vector2(height, gap*1.5),
                        new THREE.Vector2(0.3*height, gap),
                        new THREE.Vector2(0, gap),
                         new THREE.Vector2(0, -gap)];;
    //shapePoints.forEach(function(p) {
    //  shapePoints2.push(new THREE.Vector2(p.y, p.x));
    //});

    var extrudeSettings = {
				steps: 100,
				bevelEnabled: false,
				extrudePath: path
			};
      var shape = new THREE.Shape(shapePoints2);
  		var pathGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      pathGeometry.translate(-this.width/2, this.surfaceHeight/2, -this.length/2);
      if (shapeOnly) { //this is just for the demo and debugging
        return pathGeometry;
      }

      var textureGeometry = new THREE.Geometry();

      var topPlane = new THREE.BoxGeometry(this.width, this.surfaceHeight, this.length, 4, 4, 4);
      var topPlaneBSP = new ThreeBSP(topPlane);
      var negativBSP = new ThreeBSP(pathGeometry);
      var result = topPlaneBSP.subtract(negativBSP);
      topPlane = result.toMesh().geometry;
      topPlane.translate(this.width / 2, -this.surfaceHeight / 2, 0);
      textureGeometry.merge(topPlane);

      //like for every cell:
      var fill = this.getFillGeometry();
      //textureGeometry.merge(fill);
      textureGeometry.merge(this._getWallGeometry('left'));
      textureGeometry.merge(this._getWallGeometry('right'));

      textureGeometry.scale(1,1,canvasdrawer.cellCount);

      return textureGeometry;
  }


  return TextureCustom;

})();
