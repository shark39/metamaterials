'use strict';

const THREE     = require('three');
const bind      = require('../../misc/bind');

module.exports = (function() {

  function Solid(position, stiffness) {
    bind(this);
    this.position = position;

  }

  Solid.prototype.size = function () {
    return [1,1,1]
  }

  return Solid;

})();
