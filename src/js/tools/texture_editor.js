'use strict';

const $ = require('jquery');
const _ = require('lodash');
const THREE = require('three');
const createjs = require('createjs-browserify');
const bind = require('../misc/bind');

const TextureCanvasDrawer = require('./texture_canvasdrawer');

const patterns = ['regular', 'box', 'round', 'zigzag', 'diamond','spiky', 'custom', 'debug'];

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

    this.canvasdrawer = new TextureCanvasDrawer('texture_canvas');

  }


  TextureEditor.prototype.activateBrush = function(name) {
    //this.removeUnusedBrush();

    //$('.voxel-cells-btn').removeClass('active');
    var brush = {
      "type": "texture",
      rotated: this.rotatation,
      name: name || this.activeBrush.name,
      canvasdrawer: this.canvasdrawer
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
