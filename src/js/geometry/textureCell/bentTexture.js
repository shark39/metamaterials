const THREE = require('three');
const slicer = require('threejs-slice-geometry')(THREE);

module.exports = function(TextureClass) {
    class BentTexture extends TextureClass {
        cacheKey() {
            return super.cacheKey() + '|bended';
        }

        _buildGeometry() {
            var geo = super._buildGeometry();

            let width = 1.0;
            let steps = 30;
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

            return newGeo;
        }
    }

    return BentTexture;
}