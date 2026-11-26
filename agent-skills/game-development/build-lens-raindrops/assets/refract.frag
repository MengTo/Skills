#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uScene;
uniform sampler2D uField;
uniform float uAspect;
uniform float uAmount;
uniform float uBend;
out vec4 outColor;
void main() {
    vec3 data = texture(uField, vUv).rgb;
    vec2 slope = (data.rg * 255.0 - 128.0) / 127.0;
    float wet = clamp(uAmount, 0.0, 1.0);
    vec2 bend = slope * vec2(1.0 / uAspect, 1.0) * uBend * wet;
    vec4 scene = texture(uScene, clamp(vUv + bend, 0.0, 1.0));
    float glint = max(0.0, dot(slope, vec2(-0.6, 0.8))) * data.b * wet * 0.12;
    outColor = vec4(scene.rgb * (1.0 + glint), scene.a);
}
