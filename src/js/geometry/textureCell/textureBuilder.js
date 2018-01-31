const Texture = require("./texture");
const Regular = require("./textureRegular");
const Round = require("./textureRound");
const Box = require("./textureBox");
const ZigZag = require("./textureZigZag");

class TextureBuilder{
    constructor(position, textureType, stiffness, orientation, options) {
        texture = this.constructor.mapping[textureType];
        return new texture(position, stiffness, orientation, options);
    }
}

TextureBuilder.mapping = {'regular': Regular, 'round': Round, 'box': Box, 'zigzag': ZigZag};

module.exports = TextureBuilder;