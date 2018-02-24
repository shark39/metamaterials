"use strict"

var ndarray = require("ndarray")
var core = require("rle-core")
var repair = require("rle-repair")
var extents = require("rle-extents")

function rle2array(volume, bounds) {
  if(!bounds) {
    bounds = extents(volume)
  }
  var dims = [0,0,0], i, j, k, n = volume.length(), size = 1, stride = [0,0,0]
  for(i=0; i<3; ++i) {
    dims[i] = (bounds[1][i] - bounds[0][i])|0
    stride[i] = size
    size *= dims[i]
  }
  var phase = ndarray(new Int32Array(size), dims, stride, 0)
  var distance = ndarray(new Float32Array(size), dims, stride, 0)
  var ptr = size
  var X = volume.coords[0],
      Y = volume.coords[1],
      Z = volume.coords[2],
      P = volume.phases,
      D = volume.distances,
      x0,y0,z0,p,d,nptr,
      sx = bounds[0][0]|0,
      sy = bounds[0][1]|0,
      sz = bounds[0][2]|0
  for(i=n-1; i>=0; --i) {
    nptr = ptr
    x0 = (X[i]-sx)|0
    y0 = (Y[i]-sy)|0
    z0 = (Z[i]-sz)|0
    if(z0 < 0 || z0 >= dims[2]) {
      continue
    }
    if(y0 < 0) {
      x0 = y0 = 0
    } else if(y0 >= dims[1]) {
      x0 = dims[0]-1
      y0 = dims[1]-1
    } else {
      if(x0 < 0) {
        x0 = 0
      } else if(x0 >= dims[0]) {
        x0 = dims[0]-1
      }
    }
    ptr = x0 + dims[0] * (y0 + dims[1] * z0)
    d = D[i]
    p = P[i]
    for(j=nptr-1; j>=ptr; --j) {
      phase.data[j] = p
      distance.data[j] = d
    }
  }
  return {
    phase: phase,
    distance: distance
  };
}
exports.rle2array = rle2array

function array2rle(offset, phase, distance) {
  var result = new core.DynamicVolume()
    , shape = phase.shape
    , nx = shape[0]
    , ny = shape[1]
    , nz = shape[2]
    , x, y, z
  if(offset) {
    if(distance) {
      for(z=0; z<nz; ++z) {
        for(y=0; y<ny; ++y) {
          for(x=0; x<nx; ++x) {
            result.push(x-offset[0], y-offset[1], z-offset[2], Math.abs(distance.get(x,y,z)), phase.get(x,y,z))
          }
          result.push(x-offset[0], y-offset[1], z-offset[2], 1.0, 0)
        }
        for(x=0; x<nx; ++x) {
          result.push(x-offset[0], y-offset[1], z-offset[2], 1.0, 0)
        }
      }
      for(y=0; y<ny; ++y) {
        for(x=0; x<nx; ++x) {
          result.push(x-offset[0], y-offset[1], z-offset[2], 1.0, 0)
        }
      }
    } else {
      for(z=0; z<nz; ++z) {
        for(y=0; y<ny; ++y) {
          for(x=0; x<nx; ++x) {
            result.push(x-offset[0], y-offset[1], z-offset[2], 1.0, phase.get(x,y,z)|0)
          }
          result.push(x-offset[0], y-offset[1], z-offset[2], 1.0, 0)
        }
        for(x=0; x<nx; ++x) {
          result.push(x-offset[0], y-offset[1], z-offset[2], 1.0, 0)
        }
      }
      for(y=0; y<ny; ++y) {
        for(x=0; x<nx; ++x) {
          result.push(x-offset[0], y-offset[1], z-offset[2], 1.0, 0)
        }
      }
    }
  } else {
    if(distance) {
      for(z=0; z<nz; ++z) {
        for(y=0; y<ny; ++y) {
          for(x=0; x<nx; ++x) {
            result.push(x, y, z, Math.abs(distance.get(x,y,z)), phase.get(x,y,z))
          }
          result.push(x, y, z, 1.0, 0)
        }
        for(x=0; x<nx; ++x) {
          result.push(x, y, z, 1.0, 0)
        }
      }
      for(y=0; y<ny; ++y) {
        for(x=0; x<nx; ++x) {
          result.push(x, y, z, 1.0, 0)
        }
      }
    } else {
      for(z=0; z<nz; ++z) {
        for(y=0; y<ny; ++y) {
          for(x=0; x<nx; ++x) {
            result.push(x, y, z, 1.0, phase.get(x,y,z)|0)
          }
          result.push(x, y, z, 1.0, 0)
        }
        for(x=0; x<nx; ++x) {
          result.push(x, y, z, 1.0, 0)
        }
      }
      for(y=0; y<ny; ++y) {
        for(x=0; x<nx; ++x) {
          result.push(x, y, z, 1.0, 0)
        }
      }
    }
  }
  repair.removeDuplicates(result)
  return result
}

exports.array2rle = array2rle