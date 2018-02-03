'use strict';

//useful resource: https://codepen.io/samualli/pen/xbVGpP

const $ = require('jquery');
const _ = require('lodash');
const THREE = require('three');
const createjs = require('createjs-browserify');
const bind = require('../misc/bind');

class TextureCanvasDrawerC {
  constructor (canvas) {

    this.canvas = canvas;
    this.cellCount = 0;
    this.stage = new createjs.Stage(this.canvas[0]);

    this.lines = [];
    this.points = [];
    this.pathCommands = [];

    this.dimensions = {
      x: this.canvas.width(), //200
      y: this.canvas.height() //100
    };
    this.cellHeight = this.dimensions.y;
    this.cellWidth = this.dimensions.x;

  }

  initCanvas () {

  }

}/*
module.exports = (function() {

  const patterns = ['regular', 'box', 'round', 'zigzag', 'diamond', 'spiky'];

  function TextureCanvasDrawer(canvas) {

    this.canvas = canvas;
    this.cellCount = 0;

    var line;

    this.stage = new createjs.Stage(this.canvas[0]);
    this.lines = []; //paths
    this.points = [];
    this.pathCommands = [];

    this.stage.autoClear = true;

    this.dimensions = {
      x: this.canvas.width(), //200
      y: this.canvas.height() //100
    };
    this.cellHeight = this.dimensions.y;
    this.cellWidth = this.dimensions.x;

    this.initCanvas();
  }

  TextureCanvasDrawer.prototype.initCanvas = function() {

    var width = this.dimensions.x;
    var height = this.dimensions.y;
    this.cellCount++;

    //middle
    var middleLine = new createjs.Shape();
    this.stage.addChild(middleLine);
    //middleLine.graphics.setStrokeDash([2,2]);
    middleLine.graphics.setStrokeStyle([2, 2]).beginStroke("rgba(0.5,0.5,0.5,0.1)");
    middleLine.graphics.moveTo(width / 2, 0);
    middleLine.graphics.lineTo(width / 2, height);
    middleLine.graphics.endStroke();
    this.middleLine = middleLine; //needed for addCell

    this.stage.update();

  }



  TextureCanvasDrawer.prototype.load = function(coordArray) {
    // coordArray contains relative commands for lineTo commands. example [[0, 0], [1, 1]] draws a diagonal line
    //this.canvas.show();

    for (var i = 0; i < this.points.length; i++) {
      this.stage.removeChild(this.points[i]);
    }
    this.points = [];
    this.pathCommands = [];
    if (!coordArray || coordArray == []) {
      return
    }
    var self = this;
    var width = this.dimensions.x;
    var height = this.dimensions.y;
    var line = new createjs.Shape();
    this.pathCommands.push(line.graphics.moveTo(width*coordArray[0][0], height*coordArray[0][1]).command);
    for (var i = 1; i < coordArray.length; i++) {
      this.pathCommands.push(line.graphics.lineTo(width*coordArray[i][0], height*coordArray[i][1]).command);
    }
    this.drawPath();
    this.pathCommands.forEach(function(c) {
      self.addPoint(c.x, c.y);
      //.cpx, .cpy for quadratic curve
    });
    this.stage.update();
  }

  TextureCanvasDrawer.prototype.block = function() {
    //this.canvas.hide();
  }

  TextureCanvasDrawer.prototype.setCellCount = function(count) {
    this.cellCount = count;
    this.dimensions.y = this.cellHeight * count;
    this.canvas.attr({height:this.dimensions.y});
    this.middleLine.scaleY = this.dimensions.y/this.cellHeight;
  }

  TextureCanvasDrawer.prototype.addCell = function() {

			this.dimensions.y += this.cellHeight;
      this.cellCount++;

			this.canvas.attr({height:this.dimensions.y});
			this.middleLine.scaleY = this.dimensions.y/this.cellHeight;

			//add a vertical line
			var verticalLine = new createjs.Shape();
			this.stage.addChild(verticalLine);
			//middleLine.graphics.setStrokeDash([2,2]);
			verticalLine.graphics.setStrokeStyle([2, 2]).beginStroke("rgba(0.5,0.5,0.5,0.1)");
			verticalLine.graphics.moveTo(0, this.dimensions.y-this.cellHeight);
			verticalLine.graphics.lineTo(this.dimensions.x, this.dimensions.y-this.cellHeight);
			verticalLine.graphics.endStroke();

			this.stage.update();
		}

  TextureCanvasDrawer.prototype.removeCell = function() {
    this.dimensions.y -= this.cellHeight;
    this.cellCount--;

    this.canvas.attr({height: this.dimensions.y});
    this.middleLine.scaleY = this.dimensions.y/this.cellHeight;

    for (var i = 0; i < this.pathCommands.length; i++) {
      this.pathCommands[i].y = this.pathCommands[i].y/(this.dimensions.y + this.cellHeight) * this.dimensions.y;
    }
    for (var i = 0; i < this.points.length; i++) {
      this.points[i].y = this.points[i].y/(this.dimensions.y + this.cellHeight) * this.dimensions.y;
    }

    this.drawPath();

  }

  TextureCanvasDrawer.prototype.drawPath = function() {
    var self = this;
    this.lines.forEach(function(line) {
      self.stage.removeChild(line);
    });
    for (var i = 1; i < this.pathCommands.length; i++) {

      var line = new createjs.Shape();
      line.name = "line" + i;
      line.lid = i;
      line.graphics.setStrokeStyle(2).beginStroke("rgba(0,0,0,1)");
      line.graphics.moveTo(this.pathCommands[i - 1].x, this.pathCommands[i - 1].y)
      line.graphics.append(this.pathCommands[i]);
      line.graphics.endStroke();
      line.on("mousedown", function(event) {
        console.log(event.currentTarget.name, event.currentTarget.lid);
        self.injectDot(event.stageX, event.stageY, event.currentTarget.lid);
      });
      this.lines.push(line);
      this.stage.addChild(line);

    }
    this.stage.update();
  }

  TextureCanvasDrawer.prototype.injectDot = function(x, y, lid) {
    this.addPoint(x, y);
    var line = new createjs.Shape();
    var command = line.graphics.lineTo(x, y).command;
    this.pathCommands.splice(lid, 0, command);
    this.drawPath();

  }

  TextureCanvasDrawer.prototype.getCommand = function(x, y) {
    for (var i = 0; i < this.pathCommands.length; i++) {
      if (this.pathCommands[i].x == x && this.pathCommands[i].y == y) {
        return this.pathCommands[i];
      }
    }
  }

  TextureCanvasDrawer.prototype.addPoint = function(x, y) {
    var circle = new createjs.Shape();
    circle.graphics.beginFill("DeepSkyBlue").drawCircle(0, 0, 8);
    circle.x = x;
    circle.y = y;
    var self = this;
    circle.on("pressmove", function(evt) {
      self.movingDot = true;
      var command = self.getCommand(evt.currentTarget.x, evt.currentTarget.y);
      command.x = evt.stageX;
      command.y = evt.stageY;
      self.drawPath(this.pathCommands);
      evt.currentTarget.x = evt.stageX;
      evt.currentTarget.y = evt.stageY;
      self.stage.update();
    });
    circle.on("pressup", function(evt) {
      self.movingDot = false;
    });
    this.stage.addChild(circle);
    this.points.push(circle);
  }

  TextureCanvasDrawer.prototype.getPoint = function(t) {
    //t is in [0;1]
    //1. calculate length of whole path
    var length = 0;
    var parts = [0]; //array with total length till point i
    for (var i = 1; i < this.pathCommands.length; i++) {
      var v1 = new THREE.Vector2(this.pathCommands[i - 1].x, this.pathCommands[i - 1].y);
      var v2 = new THREE.Vector2(this.pathCommands[i].x, this.pathCommands[i].y);

      var distance = v2.distanceTo(v1);
      length += distance;
      parts.push(length);
    }


    //2. find the right segment
    //normalisieren with dimension.y (100)
    var i = 0;
    for (i; i < parts.length; i++) {
      if (parts[i] == t * length) {
        return new THREE.Vector3(this.pathCommands[i].x / this.dimensions.y, 0, this.pathCommands[i].y / this.dimensions.y);
      }
      if (parts[i] > t * length) {
        //interpolate
        var start = [this.pathCommands[i - 1].x / this.dimensions.y, this.pathCommands[i - 1].y / this.dimensions.y];
        var end = [this.pathCommands[i].x / this.dimensions.y, this.pathCommands[i].y / this.dimensions.y];
        var point = [t * (end[0] - start[0]) + start[0], t * (end[1] - start[1]) + start[1]];
        return new THREE.Vector3(point[0], 0, point[1]);
      }
    }

  }

  TextureCanvasDrawer.prototype.getDrawing = function() {
    var coordArray = [];
    for (var i = 0; i < this.pathCommands.length; i++) {
      coordArray.push([this.pathCommands[i].x/this.dimensions.x, this.pathCommands[i].y/this.dimensions.y]);
    }
    return coordArray;
  }

  TextureCanvasDrawer.prototype.getImage = function() {
    var image = new Image();
    image.src = this.canvas[0].toDataURL("image/png");
    return image;
  }

  return TextureCanvasDrawer;

})();
*/

module.exports = TextureCanvasDrawerC;
