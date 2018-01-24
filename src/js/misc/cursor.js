
//const bind = require('./bind');

const $ = require('jquery');
const _ = require('lodash');
const THREE = require('three');
const cursorConfig = require('./cursorConfig');


module.exports = (function() {

  function Cursor() {

    this.shaderMaterial = new THREE.RawShaderMaterial({
      transparent: true,
      uniforms: $.extend(true, {}, cursorConfig.uniforms),
      vertexShader: cursorConfig.vertexShader,
      fragmentShader: cursorConfig.fragmentShader
    });

    this.geometryMaterial =  new THREE.MeshPhongMaterial({
      color: new THREE.Color(0x666666),
      flatShading: false
    });
    var material = this.shaderMaterial;
    var geometry = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    this.mesh = new THREE.Mesh(geometry, material);

    this.isShader = true;
    this.isAddMode = true;
  }

  Cursor.prototype.setGeometry = function(geometry) {
    this.geometryMode();
    this.mesh.geometry = geometry.clone();
  }

  Cursor.prototype.deleteMode = function() {
    this.isAddMode = false;
    this.shaderMode(); // switch to shader mode here
    const cursorBorder = 0.5;
    this.mesh.material.uniforms.color.value = new THREE.Color(0xffffff);
    this.mesh.material.uniforms.borderColor.value = new THREE.Color(0xdddddd);
    this.mesh.material.uniforms.tool.value = 1;
    this.mesh.material.uniforms.borderSize.value = cursorBorder / 2.0;
}

Cursor.prototype.addMode = function() {
  //can be in geometry mode or shaderMode
  this.isAddMode = true;
  if (this.isShader) {
    this.mesh.material.uniforms.color.value = new THREE.Color(0x444444);
    this.mesh.material.uniforms.borderColor.value = new THREE.Color(0x666666);
    this.mesh.material.uniforms.tool.value = 0;
    this.mesh.material.uniforms.borderSize.value = 0;
  }
  //otherwise set geometry must be called
}

Cursor.prototype.geometryMode = function() {
  this.mesh.material = this.geometryMaterial;
  this.mesh.needsUpdate = true;
  this.isShader = false;
}

Cursor.prototype.shaderMode = function() {
  this.setGeometry(new THREE.BoxGeometry(1.0, 1.0, 1.0));
  this.mesh.material = this.shaderMaterial;
  this.mesh.needsUpdate = true;
  this.isShader = true;
}

  return Cursor;
})();
