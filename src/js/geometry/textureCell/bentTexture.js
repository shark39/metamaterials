const THREE = require('three');
const slicer = require('threejs-slice-geometry')(THREE);
const Texture = require('./texture');
const RegularTexture = require('./textureRegular');

class BentTexture extends Texture {
    constructor(position, options = {}) {
        options.diameter = options.diameter || 1;
        let textureOptions = {...options};
        textureOptions.orientation = new THREE.Vector3(0,1,0); //we need the texture always the same way
        textureOptions.surfaceGaps = true;
        delete textureOptions.texture;
        delete textureOptions.diameter;
        super(position, options);
        this.texture = new (options.texture||RegularTexture)(undefined, textureOptions);
    }

    type() {
        return "cylinder"
    }

    cacheKey() {
        return super.cacheKey() + '|bended';
    }

    cells() {
        return 1;
    }

    textureType() {
        return this.texture.textureType();
    }

    size() {
        let size = [this.diameter, this.diameter, this.diameter];
        size[this.direction] = 2;
        return size;
    }

    _buildGeometry() {
        var geo = this.texture.getGeometry();
        geo.translate(0.5, 0.5, -0.5);

        /*geo = new THREE.Geometry();
        for(var x = 0; x < 10; x++)
            for(var y = 0; y < 10; y++) {
                let box = new THREE.BoxGeometry(0.5,0.5,0.5);

                let b = Math.PI / 2 - (x/10 * Math.PI / 2);
                
                box.translate(y * Math.cos(b), y * Math.sin(b), 0)
                geo.merge(box);
            }
        return geo;*/
/*
        let width = geo.vertices.reduce((acc, v) => Math.max(v.y, acc), 0);
        geo.scale(1,1,1/width);*/
        let width = geo.vertices.reduce((acc, v) => Math.max(v.y, acc), 0);
        let steps = 5;
        var stepsize = width / steps;

        var slices = [];
        for (var step = 0; step < steps; step++) {
            let planeZ = step * stepsize;
            var plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), planeZ + stepsize);
            var slice = slicer(geo, plane, true);
            plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), -planeZ);
            slice = slicer(slice, plane, true);
            slices.push(slice);
        }

        var newGeo = new THREE.Geometry();
        slices.forEach((slice) => newGeo.merge(slice));

        let radius = this.diameter/2;
        let resultingParameter = 2 * Math.PI * radius;

        let angle = resultingParameter / Math.floor(resultingParameter) / radius; //approx 1 arc
        for (var vertex of newGeo.vertices) {
            let b =  Math.PI/2 - (vertex.z * angle);
            vertex.z = vertex.y * radius * Math.cos(b);
            vertex.y = vertex.y * radius * Math.sin(b);
        }

        newGeo.verticesNeedUpdate = true;
        newGeo.computeFlatVertexNormals();


        let cylinder = new THREE.Geometry();

        for (var i = 0; i < Math.floor(resultingParameter)-this.diameter; i++) {
            cylinder.merge(newGeo);
            newGeo.rotateX(-angle);
        }
        cylinder.mergeVertices();

        switch (this.direction) {
            case 0:
                cylinder.translate(-0.5, -0.5 + radius, -0.5 + radius);
                break;
            case 1:
                cylinder.rotateZ(Math.PI / 2);
                cylinder.translate(-0.5 + radius, -0.5, -0.5 + radius);
                break;
            case 2:
                cylinder.rotateY(-Math.PI / 2);
                cylinder.translate(-0.5 + radius, -0.5 + radius, -0.5);
                break;
        }

        return cylinder;
    }
}

module.exports = BentTexture;