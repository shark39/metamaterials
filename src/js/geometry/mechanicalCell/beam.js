'use strict';

const THREE   = require('three');

const bind    = require('../../misc/bind');
const Feature = require('./feature');

module.exports = (function() {

  function Beam(features, direction) {
    bind(this);
    this.features = features;
    this.direction = direction;
    this.buildRenderGeometry();
  }

  Beam.prototype.buildRenderGeometry = function() {
    var thickness = 0.1;
    var width = 1.0;
    var beam = new THREE.BoxGeometry(thickness, width + thickness, thickness);
    beam.merge(new THREE.BoxGeometry(thickness*2, width/2, thickness*2));
    var wall = new THREE.Geometry();

    wall.merge(beam.clone().translate(0,0,0));
    wall.merge(beam.clone().translate(-1,0,0));
    wall.merge(beam.clone().translate(-0.5, 0.5,0).rotateZ(Math.PI/2));
    wall.merge(beam.clone().translate( 0.5, 0.5,0).rotateZ(Math.PI/2));

    wall.translate(0.5, 0, 0);

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
        wall.scale(1, Math.sqrt(2)-thickness*2/width, 1);     
        wall.rotateX(-Math.PI / 4); break;
      case "neg-diagonal":
        wall.scale(1, Math.sqrt(2)-thickness*2/width, 1);
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

  return Beam;

})();
