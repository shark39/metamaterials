const THREE = require('three');
const ThreeBSP = require('three-js-csg')(THREE);

module.exports = function(geo1, geo2) {
    let _geo1 = new ThreeBSP(geo1);
    if(!geo1.vertices.length) return geo2;
    let _geo2 = new ThreeBSP(geo2);
    if(!geo2.vertices.length) return geo1;
    return _geo1.union(_geo2).toMesh().geometry;    
  }