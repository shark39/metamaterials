'use strict';

const _     = require('lodash');
const $     = require('jquery');
const Globals = require('../../global');

const THREE = require('three');
//const jscad = require('jscad');

module.exports = (function() {

  function Feature(mechanicalCell, vertices) {
    this.mechanicalCell = mechanicalCell;
    this.vertices = vertices;
    this.stiffnessFactor = 2; // stiffness ratio between members (thick part of beam) and hinges (thin part)

    this.center = this.vertices.reduce(function(sum, vertex) {
      return sum.add(vertex);
    }, new THREE.Vector3()).divideScalar(this.vertices.length);

    Globals.cellSize.registerListener(this.updateThickness);
    Globals.minThickness.registerListener(this.updateThickness);
    this.updateThickness();
  }

  Feature.prototype.updateRenderGeometry = function() {
    this.renderGeometry = this.transformRenderGeometry(this.buildRenderGeometry());
  }

  Feature.prototype.updateThickness = function() {
    const color = this.mechanicalCell.color.clone().addScalar(this.mechanicalCell.position.y / 20.0);
    const zFightingOffset = color.r * 0.00001 + color.g * 0.00002 + color.b * 0.00003;

    const cellSize = Globals.cellSize.getValue();

    const maxThickness = 1/2;
    const minThickness = Globals.minThickness.getValue() / cellSize * this.stiffnessFactor;

    //FIXME doesn't represent stiffness, because stiffness increases to the power of 4 with thickness
    this.thickness = (maxThickness-minThickness) * this.mechanicalCell.stiffness + minThickness + zFightingOffset;

    this.updateRenderGeometry();
  }

  Feature.prototype.buildRenderGeometry = function() {
    return [new THREE.BoxGeometry(1.0, 1.0, 1.0)];
  }

  Feature.prototype.transformRenderGeometry = function(renderGeometry) {
    const color = this.mechanicalCell.color.clone().addScalar(this.mechanicalCell.position.y / 20.0);

    _.forEach(renderGeometry, function(geometry) {
      geometry.applyMatrix(this.positionMatrix(this.thickness));
      geometry.color = color;
    }.bind(this));
    return renderGeometry;
  }

  Feature.prototype.buildSimulationGeometry = function() {
    const position = this.positionMatrix().applyToBufferAttribute([
      -0.5, -0.5, -0.5,
       0.5, -0.5, -0.5,
      -0.5,  0.5, -0.5,
       0.5,  0.5, -0.5,
      -0.5, -0.5,  0.5,
       0.5, -0.5,  0.5,
      -0.5,  0.5,  0.5,
       0.5,  0.5,  0.5
    ]);

    const offset = this.offsetMatrix().applyToBufferAttribute([
      -1.0, -1.0, -1.0,
       1.0, -1.0, -1.0,
      -1.0,  1.0, -1.0,
       1.0,  1.0, -1.0,
      -1.0, -1.0,  1.0,
       1.0, -1.0,  1.0,
      -1.0,  1.0,  1.0,
       1.0,  1.0,  1.0
    ]);

    return {
      position: [],
      offset: []
    };
  }

  Feature.prototype.edges = function() {
    return this.localEdges().map(function(edge) {
      return {
        vertices: [
          this.vertices[edge[0]],
          this.vertices[edge[1]]
        ],
        stiffness: this.mechanicalCell.stiffness
      };
    }.bind(this));
  }

  return Feature;

})();
