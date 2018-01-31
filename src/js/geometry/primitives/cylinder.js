'use strict';

const _ = require('lodash');
const THREE = require('three');
const Voxel = require('../voxel');

class Cylinder extends Voxel {
  constructor (position, options = {}) {
    options.diameter = options.diameter || 1;
    super(position, options);
  }

  type() {
    return "cylinder"
  }

  size() {
    let size = [this.diameter, this.diameter, this.diameter];
    size[this.direction] = 1;
    return size;
  }

  _buildGeometry() {
    let geo = new THREE.CylinderGeometry(this.diameter/2, this.diameter/2, 1, 30);
    geo.translate(this.diameter/2, 0.5, this.diameter/2);
    geo.translate(-0.5, -0.5, -0.5);
    switch (this.direction) {
      case 0: geo.rotateZ(Math.PI/2); break;
      case 1: break;
      case 2: geo.rotateX(3*Math.PI/2); break;
    }
    return geo;
  }
}

module.exports = Cylinder;