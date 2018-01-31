'use strict';

//useful resource: https://codepen.io/samualli/pen/xbVGpP

const $ = require('jquery');
const _ = require('lodash');
const THREE = require('three');
const createjs = require('createjs-browserify');
const TexturePreview = require('../geometry/textureCell/texturePreviewImageBuilder');
const bind = require('../misc/bind');


module.exports = (function() {

  function TextureCanvasDrawer(container, onChange) {
    this.parent = $('<div></div>');
    container.append($('<div>+</div>')); 
    container.append(this.parent); 
    container.append($('<div>+</div>'));  
    this.svgs = [this.cell()];
    this.coordArrays = [[[0,0], [0,1]]];
    this.onChange = onChange;
  }

  TextureCanvasDrawer.prototype.middleLine = function(from, to, i) {
    return $(document.createElementNS('http://www.w3.org/2000/svg','line')).attr({
      id:"line" + i, 
      stroke:"gray",
      "stroke-width":"3",
      "stroke-dasharray":"5, 5",
      x1:from[0]*100, y1:from[1]*100,
      x2:to[0]*100, y2:to[1]*100
    });
  }

  TextureCanvasDrawer.prototype.removeButton = function(pos, remove) {
    return $(document.createElementNS('http://www.w3.org/2000/svg','text')
              .appendChild(document.createTextNode("X")))
    .attr({
      id:"removeButton", 
      fill:"gray",
      x:pos[0]*100, y:pos[1]*100,
    }).mousedown(remove.bind(this));
  }

  TextureCanvasDrawer.prototype.line = function(from, to, i, coordArray) {
    return $(document.createElementNS('http://www.w3.org/2000/svg','line')).attr({
      id:"line" + i, 
      stroke:"darkgray",
      width:5,
      x1:from[0]*100, y1:from[1]*100,
      x2:to[0]*100, y2:to[1]*100}).mousedown((evt) => 
        this.addPoint(i, this.getSVGPoint(evt), coordArray)
      );
  }

  TextureCanvasDrawer.prototype.dot = function(length, point, i) {
    let dot = $(document.createElementNS('http://www.w3.org/2000/svg','circle')).attr({
      id:"dot" + i,
      stroke:"lightblue",
      fill:"lightblue",
      r: 5,
      cx:point[0]*100, cy:point[1]*100
    }).data("id", i).data("first", i==0).data("last", i==length-1);

    dot.mousedown((evt) => {
      this.selectedDot = evt.target;
    })

    return dot;
  }

  TextureCanvasDrawer.prototype.cell = function(coordArray = []) {
    this.coordArrays = [coordArray];
    let cell = $(document.createElementNS("http://www.w3.org/2000/svg", "svg"))
                      .attr({viewBox:"0,0,200,100", width:300, height:150})
    cell.append(this.middleLine([1,0],[1,1], 'middle'));
    cell.append(this.removeButton([1,1], () => {cell.remove()}));

    coordArray.reduce((prev, curr, i) => {
      if(i == 0) return curr;
      cell.append(this.line(prev, curr, i-1, coordArray)); 
      return curr
    }, coordArray[0]); //draw all lines

    let dots = coordArray.map(this.dot.bind(this, coordArray.length)) || [];
    cell.append(dots); //draw all dots

    cell.mousemove((evt) => {
      if (this.selectedDot) {
        let point = this.getSVGPoint(evt, cell[0]);
        let cx = Math.max(Math.min(point.x, 200), 0);
        let cy = Math.max(Math.min(point.y, 100), 0);
        if($(this.selectedDot).data("first")) cy = 0;
        if($(this.selectedDot).data("last")) cy = 100;
        this.selectedDot.setAttributeNS(null, "cx", cx);
        this.selectedDot.setAttributeNS(null, "cy", cy);
        this.selectedDotPoint = point;
        let id = $(this.selectedDot).data("id");
        this.moveLine(cell, id, cx, cy);
        coordArray[id] = [cx/100,cy/100];
        this.onChange("custom");
      }
    });

    cell.mouseup((evt) => {this.selectedDot = undefined; console.log("up")});

    this.parent.append(cell);
    return cell;
  }

  TextureCanvasDrawer.prototype.getSVGPoint = function (evt, svg) {
    svg = svg || evt.target.farthestViewportElement;
    let ctm = svg.getCTM().inverse();
    let point = svg.createSVGPoint();
    point.x = evt.offsetX; 
    point.y = evt.offsetY;
    return point.matrixTransform(ctm);
  }

  TextureCanvasDrawer.prototype.moveLine = function (svg, id, cx, cy) {
    let line1 = svg.find("#line"+(id-1));
    let line2 = svg.find("#line"+(id));
    line1.length && line1[0].setAttributeNS(null, "x2", cx);
    line1.length && line1[0].setAttributeNS(null, "y2", cy);
    line2.length && line2[0].setAttributeNS(null, "x1", cx);
    line2.length && line2[0].setAttributeNS(null, "y1", cy);
  }

  TextureCanvasDrawer.prototype.addPoint = function (id, point, coordArray) {
    coordArray.splice(id+1, 0, [point.x/100, point.y/100]); //insert at pos
    this.reset();
    this.coordArrays.forEach(this.cell.bind(this));
  }

  TextureCanvasDrawer.prototype.load = function(coordArray) {
    this.reset();
    this.cell(coordArray);
  }

  TextureCanvasDrawer.prototype.addCell = function() {
    this.cell();
	}

  TextureCanvasDrawer.prototype.removeCell = function(i) {
    this.parent.remove(i);
  }

  TextureCanvasDrawer.prototype.reset = function() {
    this.parent.empty();
  }

  TextureCanvasDrawer.prototype.block = function() {
    this.parent.empty();
  }

  TextureCanvasDrawer.prototype.getDrawing = function() {
    return this.coordArrays.reduce((prev, curr, i) => 
      [...prev,
      ...curr.map((array) => [array[0], array[1]+i])]
    ,[]);
  }

  TextureCanvasDrawer.prototype.getImage = function() {
    return TexturePreview(this.coordArrays[0]);
  }

  return TextureCanvasDrawer;

})();
