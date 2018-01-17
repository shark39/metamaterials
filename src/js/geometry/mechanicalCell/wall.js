'use strict';

const THREE        = require('three');

const bind         = require('../../misc/bind');
const Feature = require('./feature');

module.exports = (function() {

  function Wall(features, direction) {
    bind(this);
    this.features = features;
    this.direction = direction;
    this.buildRenderGeometry();
  }

  Wall.prototype.buildRenderGeometry = function() {

    this.thickness = this.thickness/this.stiffnessFactor; //set to half so scaling of length works out nicely

    var thickness = 0.1;
    var width = 1.0;
    var wall = new THREE.BoxGeometry(width, width, thickness);
    wall.merge(new THREE.BoxGeometry(width, width/2, thickness*2));
  
    switch(this.features) {
      case "top-edge":
        wall.translate(0, 0, -(width/2)); break;
      case "bottom-edge":
        wall.translate(0, 0, (width/2)); break;
      case "left-edge":
        wall.rotateX(Math.PI / 2);
        wall.translate(0, -(width/2), 0); break;
      case "right-edge":
        wall.rotateX(Math.PI / 2);
        wall.translate(0, (width/2), 0); break;    
      case "pos-diagonal":
        wall.scale(1, Math.sqrt(2)-thickness/width, 1);     
        wall.rotateX(-Math.PI / 4); break;
      case "neg-diagonal":
        wall.scale(1, Math.sqrt(2)-thickness/width, 1);
        wall.rotateX(Math.PI / 4); break;
      default:
        console.error(this.features + " not handled")            
    }

    switch(this.direction) {
      case 0: break;
      case 1: wall.rotateZ(Math.PI/2); break;
      case 2: wall.rotateY(Math.PI/2); break;
    }
    
    this.renderGeometry = wall;
  }

  return Wall;

})();
