module.exports = {vertexShader: '\
  precision highp float; \
  precision highp int; \
  \
  uniform mat4      projectionMatrix; \
  uniform mat4      modelViewMatrix; \
  uniform vec3      scale; \
  uniform float     borderSize; \
  uniform int       rotatedMode; \
  uniform float     rotatedScale; \
  uniform float     rotatedHeight; \
  uniform int       rotatedDirection; \
  \
  attribute      vec3      position; \
  attribute      vec3      normal; \
  varying     vec2      texCoords; \
  varying     float     upside; \
  \
  void main() { \
    if (rotatedDirection == 0) { \
      upside = abs(normal.x); \
    } else if(rotatedDirection == 1) { \
      upside = abs(normal.y); \
    } else { \
      upside = abs(normal.z); \
    } \
    if (rotatedMode == 1) { \
      if (rotatedDirection == 0) { \
        texCoords = position.yz; \
      } else if(rotatedDirection == 1) { \
        texCoords = position.xz; \
      } else { \
        texCoords = position.xy; \
      } \
      if (upside == 0.0) { \
        if (abs(normal.x) == 1.0) { \
          texCoords = position.zy; \
        } else if(abs(normal.y) == 1.0) { \
          texCoords = position.xz; \
        } else { \
          texCoords = position.xy; \
        } \
      }\
      \
      if (texCoords.x < 0.0 && texCoords.y < 0.0) { \
        if (upside == 1.0) { \
          texCoords = vec2(-(rotatedScale + borderSize), 0.0); \
        } else { \
          texCoords = vec2(-borderSize, -borderSize); \
        } \
      } else if (texCoords.y < 0.0) { \
        if (upside == 1.0) { \
          texCoords = vec2(0.0, -(rotatedScale + borderSize)); \
        } else { \
          texCoords = vec2(-borderSize, rotatedScale + borderSize); \
        } \
      } else if (texCoords.x < 0.0) { \
        if (upside == 1.0) { \
          texCoords = vec2(0.0, rotatedScale + borderSize); \
        } else { \
          texCoords = vec2(rotatedHeight + borderSize, -borderSize); \
        } \
      } else { \
        if (upside == 1.0) { \
          texCoords = vec2(rotatedScale + borderSize, 0.0); \
        } else { \
          texCoords = vec2(rotatedHeight + borderSize, rotatedScale + borderSize); \
        } \
      } \
      if (upside == 1.0) { \
        texCoords.x += 1.0 + 2.0 * fract(rotatedScale / 2.0); \
        texCoords *= 0.5; \
      } \
    } else { \
      float cursorBorder = 0.25; \
      vec3 scaled = (position + 0.5) * scale - borderSize; \
      if (abs(normal.x) == 1.0) { \
        texCoords = vec2(-scaled.z, scaled.y); \
      } else if(abs(normal.y) == 1.0) { \
        texCoords = vec2(scaled.x, -scaled.z); \
      } else { \
        texCoords = scaled.xy; \
      } \
    } \
    \
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); \
  }',
fragmentShader: '\
  precision highp float; \
  precision highp int; \
  \
  uniform vec3      color; \
  uniform vec3      borderColor; \
  uniform sampler2D image; \
  uniform int       tool; \
  uniform int       rotatedDirection; \
  \
  varying      vec2      texCoords; \
  varying      float     upside; \
  \
  void main() { \
    vec2 coords = fract(texCoords); \
    if (tool == 0) { \
      vec3 baseColor = upside == 1.0 ? texture2D(image, coords).xzy : ((coords.x <= 0.03 || coords.y <= 0.03 || coords.x >= 0.97 || coords.y >= 0.97) ? borderColor : color); \
      gl_FragColor = vec4(baseColor, 1.0); \
    } else if (tool == 1) { \
      vec3 baseColor = ((coords.x <= 0.03 || coords.y <= 0.03 || coords.x >= 0.97 || coords.y >= 0.97) ? borderColor : color); \
      gl_FragColor = vec4(baseColor, 0.7); \
    } else { \
      vec3 baseColor; \
      if (tool == 2) { \
        baseColor = upside == 1.0 ? texture2D(image, coords).xzy : ((coords.x <= 0.03 || coords.y <= 0.03 || coords.x >= 0.97 || coords.y >= 0.97) ? borderColor : color); \
      } else if( tool == 3) { \
        baseColor = ((coords.x <= 0.03 || coords.y <= 0.03 || coords.x >= 0.97 || coords.y >= 0.97) ? borderColor : color); \
      } \
      if (rotatedDirection == 0) {\
        baseColor.r *= 2.0; \
        baseColor.g = 0.0; \
        baseColor.b = 0.0; \
      } else if (rotatedDirection == 1) { \
        baseColor.g *= 2.0; \
        baseColor.r = 0.0; \
        baseColor.b = 0.0; \
      } else { \
        baseColor.b *= 2.0; \
        baseColor.r = 0.0; \
        baseColor.g = 0.0; \
      } \
      gl_FragColor = vec4(baseColor, 1.0); \
    } \
  }'} 
