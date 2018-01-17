'use strict';

const _        = require('lodash');
const THREE    = require('three');

const bind     = require('../../misc/bind');
const Beam     = require('./beam');
const Triangle = require('./triangle');
const Solid    = require('./solid');
const Wall     = require('./wall');
const Feature     = require('./feature');

module.exports = (function() {

  function MechanicalCell(position, features, direction, stiffness = 0.01) {
    bind(this);

    this.position = (new THREE.Vector3()).copy(position);
    this.stiffness = 0.1;

    this.solid = features.length == 1 && features[0] == "box";

    this.elements = [];

    this.featuresPerDirection = [[], [], []];
    this.featuresPerDirection[direction] = features;

    this.buildGeometry();
    this.renderMesh();
  }

  MechanicalCell.prototype.size = function () {
    return [1,1,1]
  }

  MechanicalCell.prototype.renderSolid = function() {
    let width = 1.0 + this.stiffness;
    let box = new THREE.BoxGeometry(width, width, width);
    let material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(0.2,0.2,0.2),
      flatShading: false
    });
    this.mesh = new THREE.Mesh(box, material);
  }

  MechanicalCell.prototype.setFeaturesInDirection = function(features, direction) {
    if (features.length == 1 && features[0] == "box") {
      this.solid = true;
      this.featuresPerDirection[(direction+1)%3] = [];
      this.featuresPerDirection[(direction+2)%3] = [];
    } else if (this.solid) {
      this.featuresPerDirection = [[],[],[]];
      this.solid = false;
    }
    this.featuresPerDirection[direction] = features;
    this.meshRemoved = false;
    this.buildGeometry();
    this.renderMesh();
  }

  MechanicalCell.prototype.buildGeometry = function() {
    if(this.solid) { return }

    var elements = [];
    this.featuresPerDirection.forEach((features, direction) => {
        features.forEach((feature) => {
          var elementClass = Wall; 
          if((feature == "top-edge" || feature == "bottom-edge") && this.featuresPerDirection[(direction+1) % 3].length) 
            elementClass = Beam;
          if((feature == "left-edge" || feature == "right-edge") && this.featuresPerDirection[(direction+2) % 3].length) 
            elementClass = Beam;
          if((feature == "pos-diagonal" || feature == "neg-diagonal") && 
              (this.featuresPerDirection[(direction+1) % 3].length ||    
              this.featuresPerDirection[(direction+2) % 3].length) )
            elementClass = Beam; 
          elements.push(new elementClass(feature, direction));
        }, this);
      }, this);

    this.renderGeometry = elements.reduce((sum, geometry) => {
      sum.merge(geometry.renderGeometry);
      return sum; 
    }, new THREE.Geometry());

    this.renderGeometry.mergeVertices();
  };

  MechanicalCell.prototype.renderMesh = function() {
    if(this.solid) {
      return this.renderSolid();
    }
    let color = new THREE.Color(
      this.featuresPerDirection[0].length > 0 ? 0.5 : 0,
      this.featuresPerDirection[1].length > 0 ? 0.5 : 0,
      this.featuresPerDirection[2].length > 0 ? 0.5 : 0
    );
    let material = new THREE.MeshPhongMaterial({
      color: color,
      flatShading: false,
    });

    let zfightingIndex = 
      (this.featuresPerDirection[0].length > 0) | 
      (this.featuresPerDirection[1].length > 0) << 1 |
      (this.featuresPerDirection[2].length > 0) << 2;
    let zfighting = 1 + (0.00001*zfightingIndex);
    this.renderGeometry.scale(zfighting,zfighting,zfighting);
    this.mesh = new THREE.Mesh(this.renderGeometry, material);
  }

  return MechanicalCell;

})();
