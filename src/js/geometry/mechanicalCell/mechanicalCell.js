'use strict';

const _ = require('lodash');
const THREE = require('three');
const Wall = require('./wall');
const Voxel = require('../voxel');

class MechanicalCell extends Voxel {
  constructor(position, {features, direction, stiffness = 0.01, minThickness = 0.01}) {
    if(features.length == 1 && features[0] == "box") {
      return new Voxel(position, stiffness, minThickness);
    }
    
    super(position, {stiffness, minThickness});
    this.elements = [];
    this.featuresPerDirection = [
      [],
      [],
      []
    ];
    this.featuresPerDirection[direction] = features;
  }

  type() {
    return "mechanical";
  }

  cacheKey() {
    return super.cacheKey() + '|' + JSON.stringify(this.featuresPerDirection);
  }

  setFeaturesInDirection(features, direction, stiffness) {
    this.featuresPerDirection = [
      [],
      [],
      []
    ];

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

  setMinThickness(minThickness) {
    if (this.minThickness === minThickness) return false;
    this.minThickness = minThickness;
    this.meshRemoved = false;
    this.buildGeometry();
    this.renderMesh();
    return true;
  }

  _buildGeometry(zFighting = true) {
    var elements = [];
    let thickness = this.thickness();
    this.featuresPerDirection.forEach((features, direction) => {
      features.forEach((feature) => {
        var solid = true;
        if ((feature == "top-edge" || feature == "bottom-edge") && this.featuresPerDirection[(direction + 1) % 3].length)
          solid = false;
        if ((feature == "left-edge" || feature == "right-edge") && this.featuresPerDirection[(direction + 2) % 3].length)
          solid = false;
        if ((feature == "pos-diagonal" || feature == "neg-diagonal") &&
          (this.featuresPerDirection[(direction + 1) % 3].length ||
            this.featuresPerDirection[(direction + 2) % 3].length))
          solid = false;
        elements.push(new Wall(solid, feature, direction, thickness));
      }, this);
    }, this);

    let geo = elements.reduce((sum, geometry) => {
      sum.merge(geometry.renderGeometry);
      return sum;
    }, new THREE.Geometry());

    geo.mergeVertices();

    if (zFighting) {
      let zfightingIndex =
        (this.featuresPerDirection[0].length > 0) |
        (this.featuresPerDirection[1].length > 0) << 1 |
        (this.featuresPerDirection[2].length > 0) << 2;
      let zfighting = 1 + (0.0001 * zfightingIndex);
      geo.scale(zfighting, zfighting, zfighting);
    }

    return geo;
  };

  color() {
    return new THREE.Color(
      this.featuresPerDirection[0].length > 0 ? 0.5 : 0.1,
      this.featuresPerDirection[1].length > 0 ? 0.5 : 0.1,
      this.featuresPerDirection[2].length > 0 ? 0.6 : 0.1
    );
  }
}

module.exports = MechanicalCell;