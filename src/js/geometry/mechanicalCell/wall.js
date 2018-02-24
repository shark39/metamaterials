'use strict';

const THREE        = require('three');

const bind         = require('../../misc/bind');

module.exports = (function() {

  function Wall(solid, features, direction, thickness) {
    bind(this);
    this.features = features;
    this.direction = direction;
    this.thickness = thickness;
    this.solid = solid;
    this.buildRenderGeometry();
  }

  Wall.prototype.getWedge = function () {
    var shape = new THREE.Shape();
    shape.moveTo(0,0);
    shape.lineTo(0.5, 0.5);
    shape.lineTo(1, 0);
    shape.lineTo(0, 0);
    var wedge = new THREE.ExtrudeGeometry( shape, { amount: 1, steps: 1, bevelEnabled: false} );
    wedge.translate(-0.5,-0.5,-0.5);
    wedge.rotateY(Math.PI/2);
    wedge.rotateX(Math.PI/2);
    return wedge;
  }

  Wall.prototype.experimentWall = function () {
    let thickness = this.thickness;
    var shape = new THREE.Shape();
    shape.moveTo(0,0);
    shape.lineTo(thickness, thickness);
    shape.lineTo(1-thickness, thickness);
    shape.lineTo(1, 0);
    shape.lineTo(0, 0);
    let wall = new THREE.ExtrudeGeometry( shape, { amount: 1, steps: 1, bevelEnabled: false } );
    wall.rotateX(Math.PI/2);
    wall.translate(-0.5,+0.5, -thickness/2);
    wall.rotateZ(Math.PI/2);
    return wall;
  }

  Wall.prototype.getDiagonalWall = function () {
    let thickness = this.thickness;
    var shape = new THREE.Shape();
    shape.moveTo(0,0);
    shape.lineTo(0, thickness/2);
    shape.lineTo(1-thickness/2, 1);
    shape.lineTo(1, 1);
    shape.lineTo(1, 1-thickness/2);
    shape.lineTo(thickness/2, 0);
    shape.lineTo(0, 0);
    let wall = new THREE.ExtrudeGeometry( shape, { amount: 1, steps: 1, bevelEnabled: false } );
    wall.rotateX(Math.PI/2);
    wall.rotateY(Math.PI/2);
    wall.rotateZ(Math.PI/2);
    wall.translate(-0.5,-0.5,0.5);
    
    var member = (new THREE.BoxGeometry(1, Math.sqrt(2)/2, this.thickness*2));
    member.rotateX(Math.PI*3/4);
    wall.merge(member);
    return wall;
  }  

  Wall.prototype.getSolidWall = function() {
    var width = 1.0+this.thickness/2;
    var wall = new THREE.BoxGeometry(width, width, this.thickness  );
    wall.merge(new THREE.BoxGeometry(width, width/2, this.thickness*2));
    wall.translate(0,0,-this.thickness/2);
    return wall;
  }

  Wall.prototype.getBeamWall = function() {
    var thickness = this.thickness;
    var width = 1.0 + thickness;
    var pWidth = width - thickness/2; //padding
    var p2Width = width - thickness; //margin

    var beam = new THREE.BoxGeometry(thickness, width, thickness);
    beam.merge(new THREE.BoxGeometry(thickness*2, width/2, thickness*2));
    var wall = new THREE.Geometry();

    wall.merge(beam.clone().translate(-thickness/2, 0,        -thickness/2));   //top
    wall.merge(beam.clone().translate(-pWidth,      0,        -thickness/2));  //bottom
    wall.merge(beam.clone().translate(-p2Width/2,   width/2, -thickness/2).rotateZ(Math.PI/2));
    wall.merge(beam.clone().translate( p2Width/2,   width/2, -thickness/2).rotateZ(Math.PI/2));

    wall.translate(width/2, 0, 0);
    return wall;
  }

  Wall.prototype.buildRenderGeometry = function() {

    var wall = this.solid ? this.getSolidWall() : this.getBeamWall();
    var thickness = this.thickness;
    var width = 1.0;
    var pWidth = width - thickness; //padding
    var mWidth = width + thickness; //margin
    
    switch(this.features) {
      case "top-edge":
        wall.translate(0, 0, -(pWidth/2)); break;
      case "bottom-edge":
        wall.rotateX(Math.PI);  
        wall.translate(0, 0, (pWidth/2)); break;
      case "left-edge":
        wall.rotateX(Math.PI * 1.5);
        wall.translate(0, -(pWidth/2), 0); break;
      case "right-edge":
        wall.rotateX(Math.PI / 2);
        wall.translate(0, (pWidth/2), 0); break;  
      case "pos-diagonal":
        if(this.solid) {
          wall = this.getDiagonalWall(); break; 
        }
        wall.scale(1, Math.sqrt(2)-thickness/pWidth, 1);     
        wall.rotateX(-Math.PI / 4); break;
      case "neg-diagonal":
        if(this.solid) {
          wall = this.getDiagonalWall();
          wall.rotateX(Math.PI / 2); break;
        }
        wall.scale(1, Math.sqrt(2)-thickness/pWidth, 1);
        wall.rotateX(Math.PI / 4); break;
      case "top-left-triangle": 
        wall = this.getWedge();
        wall.merge(this.getWedge().rotateX(Math.PI/2)); break;
      case "top-right-triangle": 
        wall = this.getWedge();
        wall.merge(this.getWedge().rotateX(-Math.PI/2)); break;
      case "bottom-left-triangle": 
        wall = this.getWedge().rotateX(Math.PI);
        wall.merge(this.getWedge().rotateX(Math.PI/2)); break;
      case "bottom-right-triangle": 
        wall = this.getWedge().rotateX(Math.PI);
        wall.merge(this.getWedge().rotateX(-Math.PI/2)); break;        
      default:
        console.error(this.features + " not handled")            
    }

    switch(this.direction) {
      case 0: wall.rotateX(Math.PI/2); break;
      case 1: wall.rotateZ(Math.PI/2); break;
      case 2: wall.rotateY(Math.PI/2); break;
    }
    
    this.renderGeometry = wall;
  }

  return Wall;

})();
