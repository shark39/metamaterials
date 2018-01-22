'use strict';

const _        = require('lodash');
const THREE    = require('three');

const bind     = require('../../misc/bind');
const Wall     = require('./wall');

module.exports = (function() {

  function MechanicalCell(position, features, direction, stiffness = 0.01, minThickness = 0.01) {
    bind(this);

    this.position = (new THREE.Vector3()).copy(position);
    this.stiffness = stiffness;
    this.minThickness = minThickness;

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
    let width = 1.0 + this.thickness();
    let box = new THREE.BoxGeometry(width, width, width);
    let material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(0.2+0.8*this.stiffness,0.2,0.2),
      flatShading: false
    });
    this.mesh = new THREE.Mesh(box, material);
  }

  MechanicalCell.prototype.setFeaturesInDirection = function(features, direction, stiffness) {
    if (features.length == 1 && features[0] == "box") {
      this.solid = true;
      this.featuresPerDirection[(direction+1)%3] = [];
      this.featuresPerDirection[(direction+2)%3] = [];
    } else if (this.solid) {
      this.featuresPerDirection = [[],[],[]];
      this.solid = false;
    }
    this.stiffness = stiffness;
    this.featuresPerDirection[direction] = intersect(this.featuresPerDirection[direction], features);
    this.meshRemoved = false;
    this.buildGeometry();
    this.renderMesh();

    function intersect(set1, set2) {
      if (set1.length == 0) return set2;
      return set1; //TODO which stratergy?
    }
  }

  MechanicalCell.prototype.setMinThickness = function(minThickness) {
    if(this.minThickness === minThickness) return false;
    this.minThickness = minThickness;
    this.meshRemoved = false;
    this.buildGeometry();
    this.renderMesh();
    return true;
  }

  MechanicalCell.prototype.thickness = function () {
    return this.minThickness + (0.25 - this.minThickness) * this.stiffness;
  }

  MechanicalCell.geometryCache = {};

  MechanicalCell.prototype.buildGeometry = function() {
    if(this.solid) { return }
    let cacheKey = this.featuresPerDirection[0].toString() + '|' + 
                   this.featuresPerDirection[1].toString() + '|' + 
                   this.featuresPerDirection[2].toString() + '|' +  
                   this.thickness();
    console.log(cacheKey);
    if(MechanicalCell.geometryCache.hasOwnProperty(cacheKey)) {
      return this.renderGeometry = MechanicalCell.geometryCache[cacheKey];
    }

    var elements = [];
    let thickness = this.thickness();
    this.featuresPerDirection.forEach((features, direction) => {
        features.forEach((feature) => {
          var solid = true; 
          if((feature == "top-edge" || feature == "bottom-edge") && this.featuresPerDirection[(direction+1) % 3].length) 
            solid = false;
          if((feature == "left-edge" || feature == "right-edge") && this.featuresPerDirection[(direction+2) % 3].length) 
            solid = false;
          if((feature == "pos-diagonal" || feature == "neg-diagonal") && 
              (this.featuresPerDirection[(direction+1) % 3].length ||    
              this.featuresPerDirection[(direction+2) % 3].length) )
            solid = false; 
          elements.push(new Wall(solid, feature, direction, thickness));
        }, this);
      }, this);

    this.renderGeometry = elements.reduce((sum, geometry) => {
      sum.merge(geometry.renderGeometry);
      return sum; 
    }, new THREE.Geometry());

    this.renderGeometry.mergeVertices();

    let zfightingIndex = 
      (this.featuresPerDirection[0].length > 0) | 
      (this.featuresPerDirection[1].length > 0) << 1 |
      (this.featuresPerDirection[2].length > 0) << 2;
    let zfighting = 1 + (0.0001*zfightingIndex);
    this.renderGeometry.scale(zfighting,zfighting,zfighting);

    MechanicalCell.geometryCache[cacheKey] = this.renderGeometry;
  };

  MechanicalCell.prototype.renderMesh = function() {
    if(this.solid) {
      return this.renderSolid();
    }
    let color = new THREE.Color(
      this.featuresPerDirection[0].length > 0 ? 0.5 : 0.1,
      this.featuresPerDirection[1].length > 0 ? 0.5 : 0.1,
      this.featuresPerDirection[2].length > 0 ? 0.6 : 0.1
    );
    let material = new THREE.MeshPhongMaterial({
      color: color,
      flatShading: false,
    });
    this.mesh = new THREE.Mesh(this.renderGeometry, material);
  }

  return MechanicalCell;

})();
