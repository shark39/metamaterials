const Voxel = require("./voxel");
const Box = require("./primitives/box");
const Cylinder = require("./primitives/cylinder");
const MechanicalCell = require("./mechanicalCell/mechanicalCell");
const TextureRegular = require("./textureCell/textureRegular");
const TextureRound = require("./textureCell/textureRound");
const TextureBox = require("./textureCell/textureBox");
const TextureZigZag = require("./textureCell/textureZigZag");
const TextureCustom = require("./textureCell/textureCustom");

class VoxelBuilder {
    constructor(position, type, options) {
        let _class = this.constructor.mapping[type];
        if(!_class) {
            console.warn(type + " not supported @ import");
            return new Voxel(position, options);
        }
        return new _class(position, options);
    }
}

VoxelBuilder.mapping = {
    'texture|regular': TextureRegular,
    'texture|round': TextureRound,
    'texture|box': TextureBox,
    'texture|zigzag': TextureZigZag,
    'texture|custom': TextureCustom,
    'meachnicalCell': MechanicalCell,
    'box': Box,
    'cylinder': Cylinder,
};

module.exports = VoxelBuilder;