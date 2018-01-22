
//const bind = require('./bind');

//const $ = require('jquery');
//const _ = require('lodash');
const THREE = require('three');
const cursorConfig = require('./cursorConfig');


module.exports = (function() {

  function Cursor() {

    this.material = new THREE.RawShaderMaterial({
      transparent: true,
      uniforms: {
        'scale': {
          type: 'v3',
          value: new THREE.Vector3(1.0, 1.0, 1.0)
        },
        'color': {
          type: 'c',
          value: new THREE.Color(0x444444)
        },
        'borderColor': {
          type: 'c',
          value: new THREE.Color(0x666666)
        },
        'borderSize': {
          type: 'f',
          value: 0.0
        },
        'rotatedMode': {
          type: 'i',
          value: 0
        },
        'rotatedScale': {
          type: 'f',
          value: 0.0
        },
        'rotatedHeight': {
          type: 'f',
          value: 0.0
        },
        'rotatedDirection': {
          type: 'i',
          value: 0
        },
        'image': {
          type: 't',
          value: new THREE.Texture()
        },
        'tool': {
          type: 'i',
          value: 0
        }
      },
      vertexShader: cursorConfig.vertexShader,
      fragmentShader: cursorConfig.fragmentShader
    });

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
