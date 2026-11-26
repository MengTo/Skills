#version 300 es
precision highp float;
in vec2 vUv;
uniform vec2 uFieldSize;
uniform float uAspect;
uniform float uPhase;
uniform float uIntensity;
out vec4 outColor;

float hashCell(vec2 id) {
    vec3 h = fract(vec3(id.xyx) * vec3(0.1031, 0.1030, 0.0973));
    h += dot(h, h.yzx + 33.33);
    return fract((h.x + h.y) * h.z);
}

float dropletLayer(vec2 p, float density, float travel, float wet, bool moving) {
    vec2 grid = p * density;
    float column = floor(grid.x);
    grid.y += hashCell(vec2(column, 1.0)) * 8.0;
    grid.y += travel * mix(0.65, 1.35, hashCell(vec2(column, 3.0)));
    vec2 cell = floor(grid);
    float seed = hashCell(cell + 7.3);
    float coverage = smoothstep(seed, seed + 0.12, wet * (moving ? 0.74 : 0.94));
    float radius = mix(0.065, 0.17, hashCell(cell + 19.0));
    vec2 center = vec2(mix(0.24, 0.76, hashCell(cell + 2.6)), moving ? 0.28 : 0.52);
    vec2 local = fract(grid) - center;
    if (moving) local.x += 0.024 * sin(8.0 * local.y + seed * 6.28);
    vec2 head = local / vec2(radius, radius * (moving ? 1.23 : 1.0));
    float height = pow(max(0.0, 1.0 - dot(head, head)), 1.45);
    if (moving) {
        float along = clamp(local.y / 0.54, 0.0, 1.0);
        float width = radius * mix(0.34, 0.06, along);
        float thread = 1.0 - smoothstep(0.0, width, abs(local.x));
        height = max(height, 0.24 * thread * smoothstep(0.0, 0.08, local.y) * (1.0 - along));
    }
    return coverage * height;
}

float dropHeight(vec2 p) {
    float wet = clamp(uIntensity, 0.0, 1.0);
    float beads = dropletLayer(p, 38.0, 0.0, wet, false);
    float runners = dropletLayer(p + vec2(0.13, 0.21), 12.0, uPhase * 0.52, wet, true);
    return max(0.65 * beads, runners);
}

void main() {
    vec2 p = vUv * vec2(uAspect, 1.0);
    float stepSize = 1.0 / max(1.0, uFieldSize.y);
    float height = dropHeight(p);
    vec2 slope = vec2(
        dropHeight(p + vec2(stepSize, 0.0)) - dropHeight(p - vec2(stepSize, 0.0)),
        dropHeight(p + vec2(0.0, stepSize)) - dropHeight(p - vec2(0.0, stepSize))
    ) / (2.0 * stepSize);
    vec2 encoded = vec2(128.0 / 255.0) + (127.0 / 255.0) * clamp(slope / 125.0, -1.0, 1.0);
    outColor = vec4(encoded, height, 1.0);
}
