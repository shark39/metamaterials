rle-extents
===========
Computes a bounding box for a [narrowband level set](https://github.com/mikolalysenko/rle-core).

## Install

    npm install rle-extents

## Example

```javascript
//First run length encode a bunny
var bunny = require("bunny")
var bunny_rle = require("rle-rasterize")(bunny.cells, bunny.positions)


//Compute extents of the volume
var extents = require("rle-extents")(bunny_rle)
console.log("lo=", extents[0], "hi=", extents[1])
```

## `require("rle-extents")(volume)`
Computes a bounding box for a narrowband level set.

* `volume` is a narrowband level set

**Returns** A pair of 3D arrays representing the lower and upper bounds on the volume.

## Credits
(c) 2013 Mikola Lysenko. MIT License
