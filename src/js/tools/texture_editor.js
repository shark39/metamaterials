'use strict';

const $ = require('jquery');
const _ = require('lodash');
const THREE = require('three');

const bind = require('../misc/bind');

const patterns = ['regular', 'box', 'round', 'zigzag', 'diamond','spiky'];

module.exports = (function() {

  function TextureEditor(tools) {
    bind(this);
    this.tools = tools;
    this.brushes = {};
    this.rotatation = $('#texture_rotate').checked;
    var self = this;
    patterns.forEach(function(pattern) {
      $('#'+pattern).click(function() {
        self.activateBrush(pattern);
      });
    });
    $('#texture_rotate').click(function() {
      self.rotatation = this.checked;
      self.activateBrush(); //reactivate brush with new parameter
    });

  }

  TextureEditor.prototype.activateBrush = function(name) {
    //this.removeUnusedBrush();

    //$('.voxel-cells-btn').removeClass('active');
    var brush = {
      "type": "texture",
      rotated: this.rotatation,
      name: name || this.activeBrush.name
    };
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
