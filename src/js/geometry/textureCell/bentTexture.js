const THREE = require('three');
const slicer = require('threejs-slice-geometry')(THREE);

module.exports = function (TextureClass) {
    class BentTexture extends TextureClass {
        constructor(position, options = {}) {
            options.diameter = options.cylinder.diameter || 1;
            options.directionCylinder = options.cylinder.direction || 1;
            delete options.cylinder;
            options.bent = false;
            super(position, options);
        }

        type() {
            return "cylinder"
        }

        cacheKey() {
            return super.cacheKey() + '|bended';
        }

        size() {
            let size = [this.diameter, this.diameter, this.diameter];
            size[this.directionCylinder] = 2;
            return size;
        }

        _buildGeometry() {
            var geo = super._buildGeometry();
            geo.translate(0.5, 0.5, 0.5);

            let width = 1.0;
            let steps = 7;
            var stepsize = width / steps;

            var slices = [];
            for (var step = 0; step < steps; step++) {
                let planeZ = step * stepsize;
                var plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0.5 - planeZ);
                var slice = slicer(geo, plane, true);
                plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), -0.5 + planeZ + stepsize);
                var slice = slicer(slice, plane, true);
                slices.push(slice);
            }

            while (slices.length >= 2) {
                let a = slices.shift();
                let b = slices.shift();
                a.merge(b);
                slices.push(a);
            }

            var newGeo = slices[0];
            newGeo.mergeVertices();

            for (var vertex of newGeo.vertices) {
                let actualRadius = Math.sqrt(vertex.z * vertex.z + 1);
                let expectedRadius = Math.sqrt(1.25);
                let scaleY = expectedRadius / actualRadius;

                vertex.z = vertex.z * (vertex.y + 0.5);
                vertex.y = (vertex.y + 0.5) * scaleY - 0.5;
            }

            newGeo.verticesNeedUpdate = true;
            newGeo.computeFlatVertexNormals();

            let cylinder = new THREE.Geometry();

            for (var i = 0; i < 12; i++) {
                cylinder.merge(newGeo);
                newGeo.rotateX(Math.PI * 2 / 12);
            }

            cylinder.mergeVertices();
            let factor = this.diameter / 2 / Math.sqrt(2);
            cylinder.scale(1, factor, factor);
            cylinder.translate(-0.5 + this.diameter / 2, -0.5, -0.5 + this.diameter / 2);
            switch (this.directionCylinder) {
                case 0:
                    cylinder.rotateZ(Math.PI / 2);
                    break;
                case 1:
                    break;
                case 2:
                    cylinder.rotateX(3 * Math.PI / 2);
                    break;
            }
            
            return cylinder;
        }
    }

    return BentTexture;
}