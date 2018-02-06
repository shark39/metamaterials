'use strict';

//useful resource: https://codepen.io/samualli/pen/xbVGpP

const $ = require('jquery');
const _ = require('lodash');
const THREE = require('three');
const createjs = require('createjs-browserify');
const bind = require('../misc/bind');

class TextureCanvasDrawer {
  constructor(canvas) {
    //if $(canvas).height() is 0, the optional height and width will be used
    this.canvas = canvas;
    this.cellCount = 1;
    this.stage = new createjs.Stage(this.canvas[0]);
    this.background = new createjs.Container();
    this.stage.addChild(this.background);

    this.lines = [];
    this.points = [];
    this.pathCommands = [];

    this.dimensions = {
      x: this.canvas.width() || this.canvas.attr('width'),
      y: this.canvas.height() || this.canvas.attr('height')
    };
    this.cellHeight = this.dimensions.y;
    this.cellWidth = this.dimensions.x;


    this.initCanvas();

  }

  initCanvas() {

    var width = this.dimensions.x;
    var height = this.dimensions.y;

    this.background.removeAllChildren();
    //middle
    var middleLine = new createjs.Shape();
    this.background.addChild(middleLine);
    middleLine.graphics.setStrokeDash([7, 8])
      .setStrokeStyle(2)
      .beginStroke("rgba(0.5,0.5,0.5,0.1)")
      .moveTo(width / 2, 0)
      .lineTo(width / 2, height)
      .endStroke();

    //walls
    var wallRelative = 0.2;
    var wall = new createjs.Shape();
    this.background.addChild(wall);
    wall.name = 'wall';
    wall.graphics.beginFill("#E6E7E8")
      .drawRect(0, 0, width * wallRelative, height)
      .drawRect(width - width * wallRelative, 0, width, height);

    //horizontal deviders
    var deviderLine = new createjs.Shape();
    this.background.addChild(deviderLine);
    deviderLine.graphics.setStrokeStyle([2, 2])
      .beginStroke("rgba(0.5,0.5,0.5,0.1)");

    _.range(0, height, this.cellHeight).forEach(function(c) {
      deviderLine.graphics.moveTo(0, c)
        .lineTo(width, c);
    });

    deviderLine.graphics.endStroke();

    this.stage.update();

  }

  reset() {
    //remove everything except middleLine, walls
    //empties the arrays
    for (var i = 0; i < this.points.length; i++) {
      this.stage.removeChild(this.points[i]);
    }
    this.points = [];
    this.pathCommands = [];
  }

  setCellCount(count) {
    while (this.cellCount != count) {
      this.cellCount < count ? this.addCell() : this.removeCell();
    }
  }

  addCell() {

    this.dimensions.y += this.cellHeight;
    this.cellCount++;

    this.canvas.attr({
      height: this.dimensions.y
    });



    for (var i = 1; i < this.pathCommands.length; i++) {
      this.pathCommands[i].y = this.pathCommands[i].y / (this.dimensions.y - this.cellHeight) * this.dimensions.y;
    }
    for (var i = 1; i < this.points.length; i++) {
      this.points[i].y = this.points[i].y / (this.dimensions.y - this.cellHeight) * this.dimensions.y;
    }
    this.drawPath();
    this.stage.update();
  }

  removeCell() {
    this.dimensions.y -= this.cellHeight;
    this.cellCount--;

    this.canvas.attr({
      height: this.dimensions.y
    });

    this.initCanvas();

    for (var i = 0; i < this.pathCommands.length; i++) {
      this.pathCommands[i].y = this.pathCommands[i].y / (this.dimensions.y + this.cellHeight) * this.dimensions.y;
    }
    for (var i = 0; i < this.points.length; i++) {
      this.points[i].y = this.points[i].y / (this.dimensions.y + this.cellHeight) * this.dimensions.y;
    }

    this.drawPath();

  }

  updateWalls(relativeWidth) {
    this.background.children.forEach((child) => {
      if (child.name == 'wall') {
        this.background.removeChild(child);
      }
    });

    var width = this.dimensions.x;
    var height = this.dimensions.y;

    var wallRelative = relativeWidth;
    var wall = new createjs.Shape();
    this.background.addChild(wall);
    wall.name = 'wall';
    wall.graphics.beginFill("#E6E7E8")
      .drawRect(0, 0, width * wallRelative, height)
      .drawRect(width - width * wallRelative, 0, width, height);

    this.stage.update();

    //update points
    this.applyToCoordinates((p) => {
      if (p.x < width / 2 && p.x < width * wallRelative) {
        p.x = width * wallRelative;
      } else if (p.x > width / 2 && p.x > width - width * wallRelative) {
        p.x = width - width * wallRelative;
      }
      return p;
    });

  }

  applyToCoordinates(func) {
    for (var i = 0; i < this.pathCommands.length; i++) {
      this.pathCommands[i] = func(this.pathCommands[i]);
    }
    for (var i = 0; i < this.points.length; i++) {
      this.points[i] = func(this.points[i]);
    }

    this.drawPath();

  }

  load(coordArray) {

    this.initCanvas();
    this.reset();
    if (!coordArray || coordArray.length == 0) {
      return
    }
    var width = this.dimensions.x;
    var height = this.dimensions.y;
    var line = new createjs.Shape();
    this.pathCommands.push(line.graphics.moveTo(width * coordArray[0][0], height * coordArray[0][1]).command);
    for (var i = 1; i < coordArray.length; i++) {
      this.pathCommands.push(line.graphics.lineTo(width * coordArray[i][0], height * coordArray[i][1]).command);
    }
    this.drawPath();
    this.pathCommands.forEach((c, i) => {
      var move = (x, y) => [x, y];
      if (i == 0 || i == this.pathCommands.length - 1) {
        move = (x, y) => [x, Math.min(i, 1) * this.dimensions.y];
      }
      this.addPoint(c.x, c.y, move);
      //.cpx, .cpy for quadratic curve
    });
    this.stage.update();
  }

  drawPath() {
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

  injectDot(x, y, lid) {
    this.addPoint(x, y);
    var line = new createjs.Shape();
    var command = line.graphics.lineTo(x, y).command;
    this.pathCommands.splice(lid, 0, command);
    this.drawPath();

  }

  addPoint(x, y, move = (x, y) => [x, y]) {
    var circle = new createjs.Shape();
    circle.graphics.beginFill("DeepSkyBlue").drawCircle(0, 0, 8);
    circle.x = x;
    circle.y = y;
    var self = this;
    circle.on("pressmove", function(evt) {
      self.movingDot = true;
      var command = self.getCommand(evt.currentTarget.x, evt.currentTarget.y);
      var xy = move(evt.stageX, evt.stageY);
      command.x = xy[0];
      command.y = xy[1];
      self.drawPath(this.pathCommands);
      evt.currentTarget.x = xy[0];
      evt.currentTarget.y = xy[1];
      self.stage.update();
    });
    circle.on("pressup", function(evt) {
      self.movingDot = false;
    });
    this.stage.addChild(circle);
    this.points.push(circle);
  }

  getCommand(x, y) {
    for (var i = 0; i < this.pathCommands.length; i++) {
      if (this.pathCommands[i].x == x && this.pathCommands[i].y == y) {
        return this.pathCommands[i];
      }
    }
  }

  getDrawing() {
    var coordArray = [];
    for (var i = 0; i < this.pathCommands.length; i++) {
      coordArray.push([this.pathCommands[i].x / this.dimensions.x, this.pathCommands[i].y / this.dimensions.y]);
    }
    return coordArray;
  }

  getImage() {
    var image = new Image();
    image.src = this.canvas[0].toDataURL("image/png");
    return image;
  }

  static getImageFromCoordsArray(coordArray, width = 80, height = 60) {
    var canvas = document.createElement("canvas");
    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);
    let drawer = new TextureCanvasDrawer($(canvas));
    drawer.load(coordArray);
    return drawer.getImage();
  }

  getPoint(t) {
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


}


module.exports = TextureCanvasDrawer;
