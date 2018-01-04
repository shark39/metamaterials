'use strict';

const THREE      = require('three');

const bind       = require('./misc/bind');
const threePatch = require('./misc/three_patch');

const Controls   = require('./controls');
const Renderer   = require('./renderer');
const Simulation = require('./simulation');
const VoxelGrid  = require('./geometry/voxel_grid');

module.exports = (function() {

  function Editor() {
    bind(this);

    // Enhances THREE Vector3 with utility functions.
    threePatch(THREE);

    // Maximum dimensions of the voxel grid.
    const voxelGridSize = new THREE.Vector3(100, 50, 100);

    this.renderer = new Renderer(voxelGridSize);
    this.voxelGrid = new VoxelGrid(this.renderer.scene, voxelGridSize);
    this.simulation = new Simulation(this.voxelGrid);
    this.controls = new Controls(this.renderer, this.voxelGrid, this.simulation);
  }

  Editor.prototype.run = function() {
    var renderer = this.renderer;
    function render(time) {
      renderer.update();

      if (gLastMove + kStandbyAfter < Date.now()) {
        gRunning = false;
      } else {
        gRunning = true;
        requestAnimationFrame(render);
      }
    }
    var gLastMove = Date.now();
    var gRunning = false;
    var kStandbyAfter = 100; // ms
    function requestRender() {
      gLastMove = Date.now();
      if (!gRunning) {
        requestAnimationFrame(render);
      }
    }
    window.addEventListener("mousemove", requestRender, true);
    window.addEventListener("mouseup", requestRender, true);
    window.addEventListener("mousedown", requestRender, true);
    window.addEventListener("keydown", requestRender, false);
    requestRender();
  }

  return Editor;

})();
