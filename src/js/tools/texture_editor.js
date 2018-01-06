'use strict';

const $ = require('jquery');
const _ = require('lodash');
const THREE = require('three');
const createjs = require('createjs-browserify');
const bind = require('../misc/bind');

const TextureCanvasDrawer = require('./texture_canvasdrawer');
const Texture2d = require('../geometry/texture2d');

var patterns = ['regular', 'box', 'round', 'zigzag', 'diamond','spiky', 'custom', 'debug'];

module.exports = (function() {

  function TextureEditor(tools) {
    bind(this);
    this.tools = tools;
    this.brushes = {};
    this.rotatation = $('#texture_rotate').checked;
    var self = this;
    var container = $('#texture-presets');
    patterns.forEach(function(pattern) {
      //generate UI element
      var image = Texture2d.getImage(pattern);
      var domElement = $('<div></div>')
        //.attr({ id: brush.hash })
        .addClass('voxel-btn voxel-cells-btn')
        .append($('<div></div>')
          .addClass('voxel-btn-img')
          .css({ width: 60 })
          .append($('<div></div>')
            .addClass('voxel-btn-selection')
          )
          .append(image)
        );
        domElement.click(function() {
          console.log("activated");
          self.activateBrush(pattern);
        });
      //var div = document.createElement('div');
      //div.className = "voxel-cells-btn voxel-btn-img";
      //div.style.width = "50px";
      //div.append(image);
      container.append(domElement);
      self.brushes[pattern] = {name: pattern, domElement: domElement, type: "texture"};

      //var label = document.createElement('div');
      //label.text = pattern;
      //container.append(label);


    });
    $('#texture_rotate').click(function() {
      self.rotatation = this.checked;
      self.activateBrush(); //reactivate brush with new parameter
    });

    this.canvasdrawer = new TextureCanvasDrawer('texture_canvas');

  }


  TextureEditor.prototype.activateBrush = function(name) {
    //this.removeUnusedBrush();

    $('.voxel-cells-btn').removeClass('active');



    var brush = this.brushes[name];
    brush.rotated = this.rotatation;
    brush.canvasdrawer = this.canvasdrawer;
    brush.domElement.addClass('active');
    this.activeBrush = brush;
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
