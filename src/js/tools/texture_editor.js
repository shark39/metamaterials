'use strict';

const $     = require('jquery');
const _     = require('lodash');
const THREE = require('three');

const bind  = require('../misc/bind');

module.exports = (function() {

  function TextureEditor(tools) {
    bind(this);

    this.tools = tools;
    this.brushes = {};
    var self = this;
    ["#hubbles", "#zickzack"].forEach(function(id) {
      $(id).click(function() {
        self.activateBrush(id);
      })
    });

  }

  TextureEditor.prototype.activateBrush = function(name) {
    //this.removeUnusedBrush();

    //$('.voxel-cells-btn').removeClass('active');
    var brush = {"type": "texture"};
    this.activeBrush = brush;
    //brush.domElement.addClass('active');
    this.tools.forEach(function(tool) {
      tool.activeBrush = brush;
      //tool.rotatedMode = brush.rotated;
    });

    //this.update();
  }

  TextureEditor.prototype.removeUnusedBrush = function() {
    if (this.activeBrush && !this.activeBrush.used) {
      this.activeBrush.domElement.remove();
      delete this.brushes[this.activeBrush.hash];
    }
  }



  return TextureEditor;

})();
