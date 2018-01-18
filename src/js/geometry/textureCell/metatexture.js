'use strict';

/*
This file contains the geometry construction for the texture voxels

Usage:

var texture = new Texture(options);
texture.getGeometry(type);

supported types:
- regular
- zigzag
- box
- round

*/

const THREE = require('three');
const ThreeBSP = require('three-js-csg')(THREE);

const bind = require('../../misc/bind');
const PrismGeometry = require('./prism.js');
//const TextureRegular = require('./textureRegular');

module.exports = (function() {

  function Texture(options) {
    /*options contains parameters like length, hingeThickness ...*/

    bind(this);
    options = {memberHeight: 0.33, wallWidth: 0.2, middleConnectorWidth: 0.2};
    options = options != undefined ? options : {};
    this.length = options.length || 1;
    this.height = options.height || 1;
    this.width = options.width || 2;
    this.wallWidth = options.wallWidth || 0.3;
    this.middleConnectorWidth = options.middleConnectorWidth || 0.2;
    this.surfaceHeight = options.surfaceHeight || 0.1;
    this.hingeWidth = options.hingeWidth || 0.08;

    this.memberHeight = options.memberHeight || 0.15;

    this.hingeHeight = 0.1; //  + this.stiffness/4; //this is just for visualisation
    if (options.hingeHeight != undefined) {
      console.warn("overwrite hingeHeight");
      this.hingeHeight = options.hingeHeight;
    }

    //calculate width of member
    this.memberWidth = this.width/2 - this.wallWidth - this.hingeWidth*2 - this.middleConnectorWidth/2;


    this.amplitude = Math.sqrt((this.width/2-this.wallWidth-this.middleConnectorWidth)**2 - this.memberWidth**2);
    /*Note for construction
    left wall starts at x=0, right wall ends at x=this.width=2
    top starts at y=0, bottom ends at y=-1
    */
    this.mesh = this.getMesh();
  }

  Texture.prototype.size = function () {
    return [2,1,1]
  }

  Texture.prototype.setMinThickness = function () {} //TODO

  Texture.prototype.getMesh = function () {
    var color = new THREE.Color(0, 0, 0 );
    var l = 1 - 0.8 * this.stiffness + 0.1; // from 0.1 to 0.9
    color.setHSL(0, 1, l);
    var material = new THREE.MeshPhongMaterial({
      color: color,
      flatShading: false
    });
    var textureGeometry = this.getGeometry();
    return new THREE.Mesh(textureGeometry, material);
  }

  //different geometry types:
  Texture.prototype.getGeometry = function() {}

  ///////////////////////////////////////////////////
  //HELPER FUNCTIONS TO CONSTRUCT THE TEXTURECELL //
  /////////////////////////////////////////////////
  Texture.prototype._getSurfaceGeometry = function() {
    //TODO two parts, leave out the hinges
    var topPlane = new THREE.BoxGeometry(this.width, this.surfaceHeight, this.length);
    topPlane.translate(this.width / 2, -this.surfaceHeight / 2, 0);
    return topPlane;
  }

  Texture.prototype._getMemberGeometry = function(orientation, doTranslate, options) {
    //return prism geometry
    var memberHeight = !!options ? options.memberHeight ||  this.memberHeight : this.memberHeight;
    var memberWidth = !!options ? options.memberWidth || this.memberWidth : this.memberWidth;
    orientation = orientation / Math.abs(orientation) || 1;
    var A = new THREE.Vector2(0, 0);
    var B = new THREE.Vector2(orientation * memberWidth, memberHeight);
    var C = new THREE.Vector2(0, memberHeight);

    var member = new PrismGeometry([A, B, C], this.length);
    if (doTranslate == undefined || doTranslate) {
      member.translate(-this.middleConnectorWidth / 2 - this.hingeWidth - B.x, -memberHeight - this.surfaceHeight, -this.length / 2);
    }
    return member;

  }

  Texture.prototype._getMiddleZigZagGeometry = function() {
    var A = new THREE.Vector2(-0.5, 0);
    var B = new THREE.Vector2(-0.15, this.amplitude);
    //var p = this.width / 2 - 2 * this.hingeWidth - this.wallWidth - this.middleConnectorWidth / 2;
    var C = new THREE.Vector2(0.15, this.amplitude);
    var D = new THREE.Vector2(0.5, 0);

    var m = new PrismGeometry([A, B, C, D], 0.2);
    m.rotateY(Math.PI / 2);
    //member.translate(-this.middleConnectorWidth / 2 - this.hingeWidth - B.x, -this.memberHeight - this.surfaceHeight, -this.length / 2);
    return m;
  }

  Texture.prototype._getMiddleBoxGeometry = function(widthTop, widthBottom) {
    var A = new THREE.Vector2(-widthBottom/2, 0);
    var B = new THREE.Vector2(-widthTop/2, -(this.height)/2);
    var C = new THREE.Vector2(widthTop/2, -(this.height)/2);
    var D = new THREE.Vector2(widthBottom/2, 0);
    var m = new PrismGeometry([A, B, C, D], this.length);
    return m;
  }

  Texture.prototype._getMiddleConnector = function() {
    var middleConnector = new THREE.BoxGeometry(this.middleConnectorWidth / 2, this.height, this.length, 4, 4, 4);
    middleConnector.translate(-this.middleConnectorWidth / 4, -this.height / 2, 0);
    return middleConnector;
  }

  Texture.prototype._getWallGeometry = function(side) {
    var wall = new THREE.BoxGeometry(this.wallWidth, this.height, this.length);
    wall.translate(this.wallWidth/2, -this.height / 2, 0);
    if (side == "right") {
      wall.translate(this.width-this.wallWidth, 0, 0);
    }
    return wall;
  }


  //END HELPERS


  Texture.prototype.getFillGeometry = function() {
    //returns the lower part of the texture cell without walls
    //dimensions are [this.width, this.height/2, this.length]
    // ################
    // x   #  #  #   x
    // x  #        # x
    // x#           #x
    var memberHeight = this.amplitude - this.surfaceHeight;
    var tempGeo = new THREE.Geometry();
    var topPlane = new THREE.BoxGeometry(this.width, this.surfaceHeight, this.length);
    topPlane.translate(this.width/2, memberHeight+this.surfaceHeight/2, this.length/2);
    tempGeo.merge(topPlane);

    var lowerMember1 = this._getMemberGeometry(1, false, {memberHeight: memberHeight});
    lowerMember1.translate(this.wallWidth + this.hingeWidth, 0, 0);
    tempGeo.merge(lowerMember1);

    var lowerMember2 = this._getMemberGeometry(-1, false, {memberHeight: memberHeight});
    lowerMember2.translate(this.width/2 + this.middleConnectorWidth/2 + this.hingeWidth + this.memberWidth, 0, 0);
    tempGeo.merge(lowerMember2);
    tempGeo.translate(0,  -this.height, -this.length/2);

    return tempGeo;
  }

  Texture.prototype.getSupportGeometry = function() {
    return new THREE.Geometry();
  }

  Texture.prototype.getHingesGeometry = function() {

    var textureGeometry = new THREE.Geometry();
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
      textureGeometry.merge(box);
    }

    return textureGeometry;

  }

  Texture.prototype.getMembersGeometry = function() {

    var textureGeometry = new THREE.Geometry();

    var member1 = this._getMemberGeometry(1, false);
    member1.translate(this.wallWidth + this.hingeWidth, -this.memberHeight-this.surfaceHeight, -this.length/2);
    textureGeometry.merge(member1);

    var member2 = this._getMemberGeometry(-1, false);
    member2.translate(this.width/2 + this.middleConnectorWidth/2 + this.hingeWidth + this.memberWidth, -this.memberHeight-this.surfaceHeight, -this.length/2);
    textureGeometry.merge(member2);

    return textureGeometry;
  }

  Texture.prototype.getRegularGeometry = function() {
    //regular texture pattern
    //surface + middleConnector + members

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
      textureGeometry.merge(box);

    }
    return textureGeometry;
  }


  
  Texture.prototype.getSpikyGeometry = function() {

    var textureGeometry = new THREE.Geometry();

    var middleConnector = this._getMiddleZigZagGeometry();
    middleConnector.translate(-1 - 0.15 - 0.15 / 2, -this.amplitude, 0);
    textureGeometry.merge(middleConnector);

    var topPlane = new THREE.BoxGeometry(this.width, this.surfaceHeight, this.length, 4, 4, 4);

    this.zigzagGap = this.width / 16;
    var negativ = new THREE.BoxGeometry(this.zigzagGap, this.surfaceHeight*2, Math.sqrt((this.length * 2) ** 2 + this.width ** 2));
    negativ.rotateZ(Math.PI/4);
    negativ.rotateY(Math.sin(1.4));
    //negativ.translate(0, -0.05, 0);
    var topPlaneBSP = new ThreeBSP(topPlane);
    var negativBSP = new ThreeBSP(negativ);
    var result = topPlaneBSP.subtract(negativBSP);
    topPlane = result.toMesh().geometry;
    topPlane.translate(-this.width / 2, -this.surfaceHeight / 2, 0);
    textureGeometry.merge(topPlane);

    return textureGeometry;
  }

  Texture.prototype.getCustomGeometry = function(canvasdrawer, shapeOnly) {

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


  /////////////////////////



  /*  Texture.Texture = { element: Texture, vertices: [ 0, 1, 2, 3, 4, 5, 6, 7 ], id: 's' };


    Texture.prototype.positionMatrix = function(thickness) {  }

    Texture.prototype.offsetMatrix = function() {
      return new THREE.Matrix4();
    }

    Texture.prototype.localEdges = function() {
      return [];
    }*/
  return Texture;

})();
