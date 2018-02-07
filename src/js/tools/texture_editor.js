'use strict';

const $ = require('jquery');
require('jquery-ui-browserify');
const _ = require('lodash');
const THREE = require('three');
const createjs = require('createjs-browserify');
const bind = require('../misc/bind');

const TextureCanvasDrawer = require('./texture_canvasdrawer_canvasstyle');
const TextureBuilder = require('../geometry/textureCell/textureBuilder');
const TextureCustom = require('../geometry/textureCell/textureCustom');
const Texture = require('../geometry/textureCell/texture');

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

    Object.keys(mapping).forEach((pattern) => {

      var image = TextureCanvasDrawer.getImage2(mapping[pattern].drawing());
      if (mapping[pattern].isCustomizable()) {
        image = TextureCanvasDrawer.getImageFromCoordsArray(mapping[pattern].drawing());
      }
      var domElement = getButtonDom(image);

      domElement.click(() => this.activateBrush(pattern));

      container.append(domElement);
      this.brushes[pattern] = {
        name: pattern,
        hash: pattern,
        domElement: domElement,
        type: 'texture',
        class: mapping[pattern],
        texture: mapping[pattern]
      };
    });
    //$('#texture_rotate').click(function() {
    //  self.rotatation = this.checked;
    //  self.activateBrush(); //reactivate brush with new parameter
    //});

    this.changeAmplitudeValue();
    $("#texture-amplitude-slider").on("input change", this.changeAmplitudeValue);

    this.changeSmoothnessValue();
    $("#texture-smoothness-slider").on("input change", this.changeSmoothnessValue);

    this.initDrawer();
    //$("#canvas-container").hide();
  }

  TextureEditor.prototype.changeAmplitudeValue = function(evt) {
    var slider =  $('#texture-amplitude-slider');
    const value = Number(slider.val());
    $('#texture-amplitude-value').text(value);
    if (this.canvasdrawer) {
      var wallRelative = Texture.getWallWidthFromAmplitudeRelativeToWidth(value/100, 2);
      this.canvasdrawer.updateWalls(wallRelative);
    }
  }

  TextureEditor.prototype.changeSmoothnessValue = function(evt) {
    var slider =  $('#texture-smoothness-slider');
    const value = slider.val();
    $('#texture-smoothness-value').text(value);
  }

  TextureEditor.prototype.getAmplitude = function() {
    return $('#texture-amplitude-slider').val()/100;
  }

  TextureEditor.prototype.getSmoothness = function() {
    return $('#texture-smoothness-slider').val()/100;
  }

  TextureEditor.prototype.initDrawer = function() {

    var self = this;

    let div = $('<div id="canvas-div"></div>');
    $('#canvas-container').append(div);

    let canvas = $('<canvas height=100 width=200 class="texture-canvas"></canvas>');
    div.draggable({
      disabled: false,
      axis: 'y',
      //prevent dragging when clicked on line or dot
      drag: function(event, ui) {
        return !self.canvasdrawer.movingDot;
      }
    });
    div.append(canvas);

    let addcellDom = $('<div><button type="button" class="btn btn-secondary" style="width: 100%"">extend cell</button></div>');
    addcellDom.click(function(event) {
      self.canvasdrawer.addCell();
      self.canvasdrawer.cellCount == 1 ? $('#remove-cell').hide() : $('#remove-cell').show();
    });
    div.append(addcellDom);

    let removecellDom = $('<div><button type="button" id="remove-cell" class="btn btn-secondary" style="width: 100%"">reduce cell</button></div>');
    removecellDom.click(function(event) {
      self.canvasdrawer.removeCell();
      //move everything down
      let offsetTop = Number(self.container[0].style.top.replace("px", ""));
      self.container[0].style.top = offsetTop + self.canvasdrawer.cellHeight + "px";
      //hide reduce button
      self.canvasdrawer.cellCount == 1 ? $(event.target).hide() : $(event.target).show();
    });
    $('#remove-cell').hide(); //because cellCount==1
    div.append(removecellDom);

    this.canvasdrawer = new TextureCanvasDrawer(canvas);
    this.container = div;

    div.click(function(event) {
      let image = self.canvasdrawer.getImage();
      let cc = Math.random().toString(36).substring(7);
      let pattern = "custom" + cc;
      var domElement = getButtonDom(image);
      var customPath = self.canvasdrawer.getDrawing();
      var cells = self.canvasdrawer.cellCount;
      domElement.click(function() {
        self.activateBrush(pattern, customPath, cells);
      });

      var presets = $('#texture-presets');
      presets.append(domElement);
      self.brushes[pattern] = {
        name: pattern,
        hash: pattern,
        domElement: domElement,
        type: 'texture',
        class: TextureCustom,
        texture: TextureCustom
      };

      self.activateBrush(pattern);
    });
  }


  TextureEditor.prototype.activateBrush = function(name, customPath, cells) {

    $('.voxel-cells-btn').removeClass('active');

    var brush = this.brushes[name];
    brush.domElement.addClass('active');

    let texture = mapping[name];
    if (!texture && brush.class.isCustomizable() && this.activeBrush.name != name) {
      texture = Object.assign(TextureCustom, {
        drawing: () => customPath || this.canvasdrawer.getDrawing(),
        cells: () => cells || this.canvasdrawer.cellCount,
        cacheKey: () => name,
        isCustom: () => true
      });
    }
    if ((this.activeBrush == undefined || this.activeBrush.name != name) && texture && texture.isCustomizable()) {
      this.canvasdrawer.setCellCount(texture.cells());
      this.canvasdrawer.load(texture.drawing());
      this.changeAmplitudeValue();
      $('#canvas-container').show();
    }
    if (texture && !texture.isCustomizable()) {
      //this.canvasdrawer.block();
      $('#canvas-container').hide();
    }
    if (texture && this.activeBrush && (this.activeBrush.class.isCustom())) {
      this.removeUnusedBrush();
    }

    brush.size = (orientation) => (new texture(undefined, {orientation}).size());

    brush.options = {};
    brush.options.rotatation = true;
    brush.options.amplitude = this.getAmplitude();
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
