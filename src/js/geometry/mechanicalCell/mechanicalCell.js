'use strict';

const _        = require('lodash');
const THREE    = require('three');

const bind     = require('../../misc/bind');
const Beam     = require('./beam');
const Triangle = require('./triangle');
const Solid    = require('./solid');
const Wall     = require('./wall');

module.exports = (function() {

  function MechanicalCell(position, features, direction, stiffness = 0.01, onUpdate = function () {}) {
    bind(this);

    this.position = position;
    this.onUpdate = onUpdate;
    this.stiffness = stiffness;

    this.elements = [];

    this.vertices = [
      new THREE.Vector3(-0.5, -0.5, -0.5),
      new THREE.Vector3( 0.5, -0.5, -0.5),
      new THREE.Vector3(-0.5,  0.5, -0.5),
      new THREE.Vector3( 0.5,  0.5, -0.5),
      new THREE.Vector3(-0.5, -0.5,  0.5),
      new THREE.Vector3( 0.5, -0.5,  0.5),
      new THREE.Vector3(-0.5,  0.5,  0.5),
      new THREE.Vector3( 0.5,  0.5,  0.5)
    ];
    this.features = features || [ 'box' ];
    this.direction = direction === 'undefined' ? -1 : direction;
    this.featureVertices = []; //build in buildGeometry

    this.color = new THREE.Color(
      (this.direction == 0)*0.5 + 0.5,
      (this.direction == 1)*0.5 + 0.5,
      (this.direction == 2)*0.5 + 0.5,
    );    

    this.buildGeometry();
    this.renderMesh();
  }
  MechanicalCell.featureVertices = {
    'box': {
      vertices: [0,1,2,3,4,5,6,7],
      elementClass: Solid
      },
    'top-edge': {
      vertices: [7,3,6,2],
      elementClass: Wall
      },
    'bottom-edge': {
      vertices: [5,1,4,0],
      elementClass: Wall
      },
    'left-edge': {
      vertices: [5,7,4,6],
      elementClass: Wall
      },
    'right-edge': {
      vertices: [1,3,0,2],
      elementClass: Wall
      },
    'pos-diagonal': {
      vertices: [1,7,0,6],
      elementClass: Wall
      },
    'neg-diagonal': {
      vertices: [5,3,4,2],
      elementClass: Wall
      },
    'top-right-triangle':{
      vertices: [1,7,3,0,6,2],
      elementClass: Triangle
      },
    'top-left-triangle':{
      vertices: [5,7,3,4,6,2],
      elementClass: Triangle
      },
    'bottom-left-triangle':{
      vertices: [5,1,7,4,0,6],
      elementClass: Triangle
      },
    'bottom-right-triangle':{
      vertices: [5,1,3,4,0,2],
      elementClass: Triangle
    }
  };

  MechanicalCell.prototype.buildGeometry = function() {
    var elements = [];
    this.featureVertices = this.features.map((feature) => MechanicalCell.featureVertices[feature]);
    this.featureVertices.forEach((feature) => {
        const vertices = feature.vertices.map((index) => this.vertices[index]);    
        elements.push(new feature.elementClass(this, vertices));
      }, this);

    var geometries = [];
    elements.forEach((element) => 
      element.renderGeometry.forEach((e) => 
        geometries.push(e))
    );

    this.renderGeometry = geometries.reduce((sum, geometry) => {
      sum.merge(geometry);
      return sum; 
    }, new THREE.Geometry());
  };

  MechanicalCell.prototype.renderMesh = function() {
    switch(this.direction) {
      case 0: break;
      case 1: this.renderGeometry.rotateZ(Math.PI/2); break;
      case 2: this.renderGeometry.rotateY(Math.PI/2); break;
    }

    this.renderGeometry.translate(this.position.x, this.position.y, this.position.z);

    let material = new THREE.MeshPhongMaterial({
      color: this.color,
      flatShading: false
    });
    this.mesh = new THREE.Mesh(this.renderGeometry, material);
  }

  MechanicalCell.prototype.setStiffness = function(stiffness) {
    this.stiffness = stiffness;
    this.onUpdate();
  };

  MechanicalCell.prototype.setColor = function(color) {
    this.color = color;
    this.onUpdate();
  };

  MechanicalCell.featureStore = {
    '0:left-edge': Wall.left,
    '0:top-edge': Wall.top,
    '0:right-edge': Wall.right,
    '0:bottom-edge': Wall.bottom,
    '0:pos-diagonal': Wall.posDiagonalX,
    '0:neg-diagonal': Wall.negDiagonalX,
    '0:top-left-triangle': Triangle.topLeftX,
    '0:top-right-triangle': Triangle.topRightX,
    '0:bottom-left-triangle': Triangle.bottomLeftX,
    '0:bottom-right-triangle': Triangle.bottomRightX,

    '1:left-edge': Wall.back,
    '1:top-edge': Wall.right,
    '1:right-edge': Wall.front,
    '1:bottom-edge': Wall.left,
    '1:pos-diagonal': Wall.posDiagonalY,
    '1:neg-diagonal': Wall.negDiagonalY,
    '1:top-left-triangle': Triangle.topLeftY,
    '1:top-right-triangle': Triangle.topRightY,
    '1:bottom-left-triangle': Triangle.bottomLeftY,
    '1:bottom-right-triangle': Triangle.bottomRightY,

    '2:left-edge': Wall.back,
    '2:top-edge': Wall.top,
    '2:right-edge': Wall.front,
    '2:bottom-edge': Wall.bottom,
    '2:pos-diagonal': Wall.posDiagonalZ,
    '2:neg-diagonal': Wall.negDiagonalZ,
    '2:top-left-triangle': Triangle.topLeftZ,
    '2:top-right-triangle': Triangle.topRightZ,
    '2:bottom-left-triangle': Triangle.bottomLeftZ,
    '2:bottom-right-triangle': Triangle.bottomRightZ
  };

  MechanicalCell.prototype.usedVertices = function() {
    return _.values(this.elements).map(function(element) {
      return element.vertices;
    });
  };

  MechanicalCell.prototype.edges = function() {
    return this.elements.map(function(element) {
      return element.edges();
    });
  };

  const cubeCornerBeams = [[6,1],[7,0],[4,3],[5,2]]; // beams that creat diagnal accross the cube

  MechanicalCell.prototype.positionAsString = function(color) {
    return this.position.x+","+this.position.y+","+this.position.z
  };

  const directionalVertices = [ [[0,2,4,6],[1,3,5,7]],
                                [[2,3,6,7],[0,1,4,5]],
                                [[0,1,2,3],[4,5,6,7]]];

  MechanicalCell.prototype.get2dFeaturesInDirection = function (direction, normalized) {
    var twoDFeatures = [];
    const _this = this;

    for (var i = 0; i < directionalVertices[direction].length; i++) {
      const directionalVerticeList = directionalVertices[direction][i];
      var planeVertices = [];

      for (var j = 0; j < this.featureVertices.length; j++) {
        const featureVerticeList = this.featureVertices[j];
        const planeFeature = _.intersection(featureVerticeList,directionalVerticeList);

        if (planeFeature.length == 4){
          if (normalized== true){
            return [[1,2,3,4]]
            // return 'solid';
          } else{
            twoDFeatures = planeFeature;
            return [twoDFeatures];
            // return 'solid';
          }
        }
        if (planeFeature.length > 1){
          planeVertices.push(planeFeature);
        }
      }
      if (planeVertices.length > twoDFeatures.length){
        // take the plane that has the most features (important if one side is deleted w/ shoot-through)
        twoDFeatures = planeVertices;
      }
    }
    if (normalized == true){
      var normalizedVertices = [];
      twoDFeatures.map(function (feature) {
        const normalizedFeature = _this.normalize2dFeatureInDirection(direction,feature);
        normalizedVertices.push(normalizedFeature);
      });
      return normalizedVertices;
    }
    return twoDFeatures;
  };

  const normalize2dFeatureInDirectionMap = {
    0:[3,3,0,0,2,2,1,1],
    1:[0,1,0,1,3,2,3,2],
    2:[3,2,0,1,3,2,0,1]
  }
  MechanicalCell.prototype.normalize2dFeatureInDirection = function (direction, twoDFeature) {
    return twoDFeature.map((value) => normalize2dFeatureInDirectionMap[direction][value]);
  };

  MechanicalCell.prototype.getNormalizedPairs = function (normalizedFeatureArray) {
    var returnArray = [];
    for (var i = 0; i < normalizedFeatureArray.length; i++){
      for (var j = 0; j < normalizedFeatureArray.length; j++){
        if (j > i){
          // if joined by one vertice
          if (_.union(normalizedFeatureArray[i],normalizedFeatureArray[j]).length == 3){
            returnArray.push([normalizedFeatureArray[i],normalizedFeatureArray[j]]);
          }
        }
      }
    }
    return returnArray;
  };

  const featuresAsLines = [
    null, 
    [0,1],
    [1,2],
    [2,3],
    [3,0],
    [3,1],
    [0,2]
  ];

  MechanicalCell.prototype.getFeatureWallAsPair = function (wallValue) {
    return featuresAsLines[wallValue];
  };

  MechanicalCell.prototype.getLineValue = function (normalizedFeature) {
    if (normalizedFeature.length == 2){
      for (var i = 1; i <= 6; i++){
        if (_.union(featuresAsLines[i],normalizedFeature).length == 2){
          // if the normalizedFeature matches the position in featureAsLines,
          // then its line value is that position
          return i;
        }
      }
    } else{
      return false;
    }
  };

  MechanicalCell.prototype.getFeaturePairsAsLines = function (featurePairs) {
    var featurePairsAsLines = {'right':[],"accute":[]};
    const _this = this
    featurePairs.map(function(featuresArray){
      var featurePair = [];
      featuresArray.map(function (featureArray) {
        featurePair.push(_this.getLineValue(featureArray));
      });
      if (_.union([5,6],featurePair).length > 3){ // no diagnals used
        featurePairsAsLines.right.push(featurePair);
      } else{
        featurePairsAsLines.accute.push(featurePair);
      }
    });

    return featurePairsAsLines;
  };

  MechanicalCell.prototype.getNeighborPositionOnAxisInDirection = function (axis, wallDirection) {
    if (axis == 0){
      switch (wallDirection){
        case 1:
          return {'x':this.position.x,'y':this.position.y+1,'z':this.position.z};
        case 2:
          return {'x':this.position.x,'y':this.position.y,'z':this.position.z+1};
        case 3:
          return {'x':this.position.x,'y':this.position.y-1,'z':this.position.z};
        case 4:
          return {'x':this.position.x,'y':this.position.y,'z':this.position.z-1};
      }
    } else if(axis ==1 ){
      switch (wallDirection){
        case 1:
          return {'x':this.position.x,'y':this.position.y,'z':this.position.z-1};
        case 2:
          return {'x':this.position.x+1,'y':this.position.y,'z':this.position.z};
        case 3:
          return {'x':this.position.x,'y':this.position.y,'z':this.position.z+1};
        case 4:
          return {'x':this.position.x-1,'y':this.position.y,'z':this.position.z};
      }
    } else{ // axis == 2
      switch (wallDirection){
        case 1:
          return {'x':this.position.x,'y':this.position.y+1,'z':this.position.z};
        case 2:
          return {'x':this.position.x+1,'y':this.position.y,'z':this.position.z};
        case 3:
          return {'x':this.position.x,'y':this.position.y-1,'z':this.position.z};
        case 4:
          return {'x':this.position.x-1,'y':this.position.y,'z':this.position.z};
      }
    }
  };

  MechanicalCell.prototype.getNeighborPositionOnAxisFromCorner = function (axis, corner) {
    if (axis == 0){
      switch (corner){
        case 0:
          return {'x':this.position.x,'y':this.position.y+1,'z':this.position.z-1};
        case 1:
          return {'x':this.position.x,'y':this.position.y+1,'z':this.position.z+1};
        case 2:
          return {'x':this.position.x,'y':this.position.y-1,'z':this.position.z+1};
        case 3:
          return {'x':this.position.x,'y':this.position.y-1,'z':this.position.z-1};
      }
    } else if(axis ==1 ){
      switch (corner){
        case 0:
          return {'x':this.position.x-1,'y':this.position.y,'z':this.position.z-1};
        case 1:
          return {'x':this.position.x+1,'y':this.position.y,'z':this.position.z-1};
        case 2:
          return {'x':this.position.x+1,'y':this.position.y,'z':this.position.z+1};
        case 3:
          return {'x':this.position.x-1,'y':this.position.y,'z':this.position.z+1};
      }
    } else{ // axis == 2
      switch (corner){
        case 0:
          return {'x':this.position.x-1,'y':this.position.y+1,'z':this.position.z};
        case 1:
          return {'x':this.position.x+1,'y':this.position.y+1,'z':this.position.z};
        case 2:
          return {'x':this.position.x+1,'y':this.position.y-1,'z':this.position.z};
        case 3:
          return {'x':this.position.x-1,'y':this.position.y-1,'z':this.position.z};
      }
    }
  };

  MechanicalCell.prototype.lineAsFeature = function (featureLine) {
    return featuresAsLines[featureLine];
  };

  MechanicalCell.prototype.coordinatesToString = function (position) {
    return position.x+","+position.y+","+position.z;
  };

  MechanicalCell.prototype.markBad = function () {
    this.setColor(new THREE.Color(1, 0.75, 0.55));
    // this.buffer.setMechanicalCellColor(this.position, this.color);
  };

  MechanicalCell.prototype.wallDirectionToValue = 
  MechanicalCell.prototype.getWallValue = function (wallDirection) {
    return [undefined, 1, 1, -1, -1, -1, 1][wallDirection];
  };

  MechanicalCell.prototype.getOppositeWall = function (wall) {
    return [-2,3,4,1][wall];
  };
  return MechanicalCell;

})();
