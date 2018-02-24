rle-ndarray
===========
Conversion between rle volumes and ndarrays

## Install

    npm install rle-ndarray
    

## API

```javascript
var convert = require("rle-ndarray")
```

### `convert.rle2array(volume[, bounds])`
Converts an rle data structure into an ndarray

* `volume` is the volume we are converting
* `bounds is a bound on the region to convert (optional)

**Returns** An object containing a pair of ndarrays:

* `phase` is the phase field of the volume
* `distance` is the distance field of the volume


### `convert.array2rle(phase[, distance, offset])`
Converts an ndarray into an rle data structure

* `phase` an array of phases
* `distance` approximate signed distance to boundary (default constant 1.0)
* `offset` a translational offset which is applied to the array (default [0,0,0])

**Returns** An ndarray encoding the array

## Credits
(c) 2013 Mikola Lysenko. MIT License