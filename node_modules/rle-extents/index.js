"use strict"

var rle = require("rle-core")

var POSITIVE_INFINITY = rle.POSITIVE_INFINITY
var NEGATIVE_INFINITY = rle.NEGATIVE_INFINITY

function defaultSolid(phase) {
  return !!phase
}

function getBounds(volume, solid_func) {
  var lo = [POSITIVE_INFINITY, POSITIVE_INFINITY, POSITIVE_INFINITY]
    , hi = [NEGATIVE_INFINITY, NEGATIVE_INFINITY, NEGATIVE_INFINITY]
    , n = volume.length()
    , coords = volume.coords
    , phases = volume.phases
    , i, j
  if(!solid_func) {
    solid_func = defaultSolid
  }
  for(i=0; i<n-1; ++i) {
    if(solid_func(phases[i])) {
      for(j=0; j<3; ++j) {
        lo[j] = Math.min(coords[j][i], lo[j])
        hi[j] = Math.max(coords[j][i], hi[j])
      }
    }
  }
  for(j=0; j<3; ++j) {
    --lo[j]
    ++hi[j]
  }
  return [lo, hi]
}
module.exports = getBounds
