'use strict';

const $ = require('jquery');

module.exports = function(coordArray) {

  var svg = $(document.createElementNS("http://www.w3.org/2000/svg", "svg"))
            .attr({viewBox:"0,0,40,20", width:40, height:20});
  
  let first = coordArray.shift();
  coordArray.reduce((prev, curr, i) => {
    $(document.createElementNS('http://www.w3.org/2000/svg','line')).attr({
          id:"line" + i, 
          stroke:"black",
          x1:prev[0]*40, y1:prev[1]*20,
          x2:curr[0]*40, y2:curr[1]*20})
      .appendTo(svg);
      return curr;
    }, first);

    return svg;
  }
