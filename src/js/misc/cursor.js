
//const bind = require('./bind');

const $ = require('jquery');
const _ = require('lodash');
const THREE = require('three');
const cursorConfig = require('./cursorConfig');


module.exports = (function() {

  function Cursor() {

    this.material = new THREE.RawShaderMaterial({
      transparent: true,
      uniforms: $.extend(true, {}, cursorConfig.uniforms),
      vertexShader: cursorConfig.vertexShader,
      fragmentShader: cursorConfig.fragmentShader
    });

    /*this.material =  new THREE.MeshPhongMaterial({
      color: new THREE.Color(0.5, 0.5, 0.5),
      flatShading: false
    });*/
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

  Cursor.prototype.deleteMode = function() {
  const cursorBorder = 0.5;
  this.mesh.material.uniforms.color.value = new THREE.Color(0xffffff);
  this.mesh.material.uniforms.borderColor.value = new THREE.Color(0xdddddd);
  this.mesh.material.uniforms.tool.value = 1;
  this.mesh.material.uniforms.borderSize.value = cursorBorder / 2.0;
}

Cursor.prototype.addMode = function() {
  this.mesh.material.uniforms.color.value = new THREE.Color(0x444444);
  this.mesh.material.uniforms.borderColor.value = new THREE.Color(0x666666);
  this.mesh.material.uniforms.tool.value = 0;
  this.mesh.material.uniforms.borderSize.value = 0;
}

  return Cursor;
})();
