//First run length encode a bunny
var bunny = require("bunny")
var bunny_rle = require("rle-rasterize")(bunny.cells, bunny.positions)

//Compute extents of the volume
var extents = require("../index.js")(bunny_rle)
console.log("lo=", extents[0], "hi=", extents[1])
