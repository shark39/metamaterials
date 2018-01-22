
//const bind = require('./bind');

//const $ = require('jquery');
//const _ = require('lodash');
const THREE = require('three');


module.exports = (function() {

  function Cursor() {

    this.material =  new THREE.MeshPhongMaterial({
      color: new THREE.Color(0.5, 0.5, 0.5),
      flatShading: false
    });
    var geometry = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    this.mesh = new THREE.Mesh(geometry, this.material);
  }

  Cursor.prototype.setGeometry = function(geometry) {
    this.mesh.geometry.vertices = geometry.vertices;
    this.mesh.geometry.faces = geometry.faces;
    this.mesh.geometry.verticesNeedUpdate = true;
    this.mesh.geometry.elementsNeedUpdate = true;
    this.mesh.geometry.morphTargetsNeedUpdate = true;
    this.mesh.geometry.uvsNeedUpdate = true;
    this.mesh.geometry.colorsNeedUpdate = true;
    this.mesh.geometry.tangentsNeedUpdate = true;
  }

  return Cursor;
})();
