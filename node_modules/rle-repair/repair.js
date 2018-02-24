"use strict"; "use restrict";

var core      = require("rle-core");
var stencils  = require("rle-stencils");

var CROSS_STENCIL = stencils.CROSS_STENCIL;
var beginStencil  = core.beginStencil;

//Reorders all runs to lexicographic order
exports.resort = function(volume) {
  var coords    = volume.coords
    , phases    = volume.phases
    , distances = volume.distances
    , length    = volume.length()
    , perm      = new Array(volume.length);
  for(var i=0; i<volume.length(); ++i) {
    perm[i] = [ coords[0][i], coords[1][i], coords[2][i], distances[i], phases[i] ];
  }
  perm.sort(rle.compareCoord);
  for(var i=0; i<volume.length; ++i) {
    var run = perm[i];
    coords[0][i] = run[0];
    coords[1][i] = run[1];
    coords[2][i] = run[2];
    distances[i] = run[3];
    phases[i]    = run[4];
  }
  return volume;
}


//Adds missing surface runs
exports.resurface = function(volume) {
  //TODO: Not implemented yet
  return volume;
}

//Remove old indices
function deleteIndices(array, dead_runs) {
  var ptr = dead_runs[0];
  for(var i=0; i<dead_runs.length; ++i) {
    //Copy interval from [l,h] backwards (ie do a memmove)
    var l = dead_runs[i]+1
      , h = i < dead_runs.length-1 ? dead_runs[i+1] : array.length;
    for(var j=l; j<h; ++j) {
      array[ptr++] = array[j];
    }
  }
  array.length = array.length - dead_runs.length;
}

//Clean up redundant runs
exports.removeDuplicates = function(volume) {
  var dead_runs   = []
    , vcoords     = volume.coords
    , vdistances  = volume.distances
    , vphases     = volume.phases;
  //Skip first run
  var iter    = beginStencil(volume, CROSS_STENCIL)
    , icoord  = iter.coord
    , ptrs    = iter.ptrs;
  iter.next();
outer_loop:
  for(; iter.hasNext(); iter.next()) {
    //Skip runs which aren't at center
    var cptr = iter.ptrs[0];
    for(var i=0; i<3; ++i) {
      if(icoord[i] !== vcoords[i][cptr]) {
        continue outer_loop;
      }
    }
    //Check if all neighbors are equal
    var phase = vphases[cptr];
    for(var i=1; i<7; ++i) {
      if(phase !== vphases[ptrs[i]] ) {
        continue outer_loop;
      }
    }
    dead_runs.push(cptr);
  }
  //Remove dead runs
  if(dead_runs.length > 0) {
    for(var i=0; i<3; ++i) {
      deleteIndices(vcoords[i], dead_runs);
    }
    deleteIndices(vdistances, dead_runs);
    deleteIndices(vphases, dead_runs);
  }
  return volume;
}

exports.fullRepair = function(volume) {
  exports.resort(volume);
  exports.resurface(volume);
  exports.removeDuplicates(volume);
}
