'use strict';

const $ = require('jquery');
require('jquery-ui-browserify');
const _ = require('lodash');
const THREE = require('three');
const createjs = require('createjs-browserify');
const bind = require('../misc/bind');

const TextureCanvasDrawer = require('./texture_canvasdrawer');
const Texture2d = require('../geometry/textureCell/texture2d');

const patterns = ['regular', 'box', 'round', 'zigzag', 'diamond', 'spiky', 'custom', 'debug'];

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
          .css({
            width: 60
          })
          .append($('<div></div>')
            .addClass('voxel-btn-selection')
          )
          .append(image)
        );
      domElement.click(function() {
        self.activateBrush(pattern);
      });
      //var div = document.createElement('div');
      //div.className = "voxel-cells-btn voxel-btn-img";
      //div.style.width = "50px";
      //div.append(image);
      container.append(domElement);
      self.brushes[pattern] = {
        name: pattern,
        domElement: domElement,
        type: "texture"
      };

      //var label = document.createElement('div');
      //label.text = pattern;
      //container.append(label);


    });
    $('#texture_rotate').click(function() {
      self.rotatation = this.checked;
      self.activateBrush(); //reactivate brush with new parameter
    });

    //
    let div = $('<div></div>');
    $('#canvas-container').append(div);
    let canvas = $('<canvas height=100 width=200 class="texture-canvas"></canvas>');
    div.draggable({
      disabled: false,
      //prevent dragging when clicked on line or dot
      drag: function(event, ui) {
        return !self.canvasdrawer.movingDot;
      }
    });
    div.append(canvas);
    let addcellDom = $('<div>+</div>');
    addcellDom.click(function(event) {
      self.canvasdrawer.addCell();
    });
    div.append(addcellDom);
    this.canvasdrawer = new TextureCanvasDrawer(canvas);

    //this.canvasdrawer = new TextureCanvasDrawer($('#canvas-container'));
    // onchange: update --> generate image, name, add to brushes and activateBrush


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
