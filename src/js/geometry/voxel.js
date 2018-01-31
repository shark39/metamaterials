'use strict';
const THREE = require('three');

class Voxel {
    constructor(position = new THREE.Vector3(), {stiffness = 0.01, minThickness = 0.01}) {
        this.position = position.clone();
        this.stiffness = stiffness;
        this.minThickness = minThickness;
    }

    size() {
        return [1, 1, 1]
    }

    type() {
        return "voxel"
    }

    cacheKey() {
        return this.type() + '|' + this.stiffness + '|' + this.minThickness;
    }

    json() {
        return {
            position: this.position,
            type: this.type(),
            stiffness: this.stiffness
        }
    }

    _buildGeometry() {
        let width = 1.0 + this.thickness();
        return new THREE.BoxGeometry(width, width, width);
    }

    thickness() {
        return this.minThickness + (0.25 - this.minThickness) * this.stiffness;
    }

    getGeometry() {
        let key = this.cacheKey();
        let cache = this.constructor.geometryCache;
        if (!cache.hasOwnProperty(key)) {
            cache[key] = this._buildGeometry();
        };
        return cache[key].clone();
    };

    color() {
        return new THREE.Color(0.4,0.4,0.4);
    }

    getMesh() {
        let material = new THREE.MeshPhongMaterial({
            color: this.color(),
            flatShading: false,
        });
        this.mesh = new THREE.Mesh(this.getGeometry(), material);
        return this.mesh;
    }
}

Voxel.geometryCache = {};

module.exports = Voxel;