'use strict';

const _ = require('lodash');
const THREE = require('three');
const Voxel = require('../voxel');

class Box extends Voxel {
  type() {
    return "box"
  }
}

module.exports = Box;