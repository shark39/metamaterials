const Texture = require("./texture");
const Regular = require("./textureRegular");
const Round = require("./textureRound");
const Box = require("./textureBox");
const ZigZag = require("./textureZigZag");
const Custom = require('./textureCustom');

Object.assign(Custom, {
  isCustom: () => false,
  cacheKey: () => 'custombase'
}); //this base class is not custom

class TextureBuilder {
  constructor(position, textureType, stiffness, orientation, options) {
    texture = this.constructor.mapping[textureType];
    return new texture(position, stiffness, orientation, options);
  }
}

TextureBuilder.mapping = {
  'regular': Regular,
  'round': Round,
  'box': Box,
  'zigzag': ZigZag,
  'custombasic': Custom
};

//TODO add missing: 'diamond', 'spiky' (==zigzag)

module.exports = TextureBuilder;
