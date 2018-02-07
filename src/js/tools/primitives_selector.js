'use strict';

const $ = require('jquery');
const THREE = require('three');
const Box = require('../geometry/primitives/box');
const Cylinder = require('../geometry/primitives/cylinder');

module.exports = (function (tools) {

    function PrimitivesSelector(tools) {
        let primitives = {
            box: {
                img: "./img/primitive_cube.png",
                constructor: Box
            },
            cylinder: {
                img: "./img/primitive_cylinder.png",
                constructor: Cylinder
            }
        }

        for (var key in primitives) {
            this.addBrush(key, primitives[key])
        }

        this.tools = tools;

    }

    PrimitivesSelector.prototype.addBrush = function (type, {
        img,
        constructor
    }) {
        let button = $('<div></div>')
            .attr({
                id: type
            })
            .addClass('voxel-btn voxel-cells-btn')
            .addClass(type == "box" ? 'active' : "")
            .append(
                $('<div></div>')
                    .addClass('voxel-btn-img')
                    .css({width: 50})
                    .append($('<div></div>')
                        .addClass('voxel-btn-selection')
                    )
                    .append($('<img src="' + img + '"/>'))
                    .append($(`<div>${type}</div>`))
            );
        button.click((evt) => {
            $('.voxel-cells-btn').removeClass('active');
            this.tools.forEach(function (tool) {
                tool.activeBrush = {
                    class: constructor,
                    size: () => [1,1,1],
                    type
                };
            });
            $(evt.currentTarget).addClass('active');
        });
        $(".voxel-primitives-container").append(button);
    }



    return PrimitivesSelector;

})();
