'use strict';

const $ = require('jquery');
require('jquery-ui-browserify');
const _ = require('lodash');
const THREE = require('three');
const createjs = require('createjs-browserify');
const bind = require('../misc/bind');

const TextureCanvasDrawer = require('./texture_canvasdrawer_canvasstyle');
const TexturePreview = require('../geometry/textureCell/texturePreviewImageBuilder');
const TextureBuilder = require('../geometry/textureCell/textureBuilder');
const TextureCustom = require('../geometry/textureCell/textureCustom');


const patterns = ['regular', 'round', 'box', 'zigzag']; //'diamond', 'spiky', 'custom', 'debug'];
const mapping = TextureBuilder.mapping;

module.exports = (function() {

  function getButtonDom(image) {
    return $('<div></div>')
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
        .append(image));
  }

  function TextureEditor(tools) {
    bind(this);
    this.tools = tools;
    this.brushes = {};
    this.rotatation = $('#texture_rotate').checked;
    var self = this;
    var container = $('#texture-presets');

    patterns.forEach(function(pattern) {

      var width = 80;
      var height = 60;
      var canvas = document.createElement("canvas");
      canvas.setAttribute('width', width);
      canvas.setAttribute('height', height);
      //var image = Texture2d.getImageFromCoordsArray(mapping[pattern].getDrawing());
      //var domElement = getButtonDom(image);

      //var image = TexturePreview(mapping[pattern].drawing());
      var domElement = getButtonDom($('<div></div>'));

      domElement.click(function() {
        self.activateBrush(pattern);
      });

      container.append(domElement);
      self.brushes[pattern] = {
        name: pattern,
        domElement: domElement,
        type: "texture"
      };
    });
    $('#texture_rotate').click(function() {
      self.rotatation = this.checked;
      self.activateBrush(); //reactivate brush with new parameter
    });

    this.canvasdrawer = new TextureCanvasDrawer($(canvas)); //, this.activateBrush.bind(this);

    //$("#canvas-container").hide();
  }


  TextureEditor.prototype.activateBrush = function(name) {

    $('.voxel-cells-btn').removeClass('active');

    let texture;
    if (name.startsWith("custom") &&  this.activeBrush.name != name) {
      texture = TextureCustom;
      texture.drawing = () => customPath || this.canvasdrawer.getDrawing();
    } else {
      texture = mapping[name];
    }

    if ((this.activeBrush == undefined || this.activeBrush.name != name) && texture && texture.isCustomizable()) {
      this.canvasdrawer.load(texture.drawing());
      $("#canvas-container").show();
    }
    if (texture && !texture.isCustomizable()) {
      this.canvasdrawer.block();
      $("#canvas-container").hide();
    }
    if (texture && this.activeBrush && this.activeBrush.name.startsWith('custom')) {
      this.removeUnusedBrush();
    }
    var brush = this.brushes[name];
    brush.name = name;
    brush.hash = name;
    brush.rotated = this.rotatation;
    brush.canvasdrawer = this.canvasdrawer;
    brush.domElement.addClass('active');
    brush.texture = texture;
    brush.class = texture;
    this.activeBrush = brush;
    this.tools.forEach(function(tool) {
      tool.activeBrush = brush;
    });
  }

  TextureEditor.prototype.removeUnusedBrush = function() {
    if (this.activeBrush && !this.activeBrush.used) {
      this.activeBrush.domElement.remove();
      delete this.brushes[this.activeBrush.hash];
    }
  }

  return TextureEditor;

})();
