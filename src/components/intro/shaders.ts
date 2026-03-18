export const VERTEX_SHADER = /* glsl */ `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Bold flowing ribbon strips — Netflix pre-roll inspired.
// Text masking done via CSS mix-blend-mode in the component.
export const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float u_time;
  uniform vec2 u_resolution;

  float rand(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
  }

  // Single ribbon layer: colored vertical strips warped by sine waves
  vec3 ribbons(vec2 uv, float angle, float speed, float density) {
    // Rotate around center
    uv -= 0.5;
    uv = rot(angle) * uv;
    uv += 0.5;

    // Create vertical strips
    uv.x *= density;

    // Flowing sine warp — the key Netflix-style motion
    uv.x += sin(uv.y * 6.2831 + speed) * 2.0
           + sin(uv.y * 3.1416 + speed * 0.7) * 1.5;

    vec2 id = floor(uv);
    float r = rand(id);

    // 20% of strips are black gaps for contrast
    if (r < 0.2) return vec3(0.0);

    // Per-strip color from a vivid bright palette
    float hue = rand(id + 42.0);
    vec3 col;
    if (hue < 0.25)      col = vec3(1.0, 1.0, 1.0);             // pure white
    else if (hue < 0.40) col = vec3(0.5, 0.8, 1.0);             // sky blue
    else if (hue < 0.55) col = vec3(0.3, 1.0, 0.95);            // bright cyan
    else if (hue < 0.70) col = vec3(0.75, 0.45, 1.0);           // vivid violet
    else if (hue < 0.85) col = vec3(0.95, 0.95, 1.0);           // ice white
    else                  col = vec3(0.6, 0.85, 1.0);            // light blue

    // Per-strip brightness — keep it high
    float brightness = 0.75 + 0.25 * rand(id + 7.0);
    col *= brightness;

    return col;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float t = u_time;
    float aspect = u_resolution.x / u_resolution.y;

    // Intensity envelope
    float fadeIn = smoothstep(0.2, 1.0, t);
    float fadeOut = 1.0 - smoothstep(3.2, 4.5, t);
    float intensity = fadeIn * fadeOut;

    vec3 color = vec3(0.0);

    // Layer 1: Main horizontal ribbons (dominant)
    color += ribbons(uv, 0.0, t * 2.5, 45.0) * 0.75;

    // Layer 2: Slightly tilted ribbons for depth
    color += ribbons(uv, 0.12, t * 2.0 + 1.0, 35.0) * 0.40;

    // Layer 3: Counter-tilted subtle layer
    color += ribbons(uv, -0.08, t * 3.0 + 2.0, 55.0) * 0.25;

    // Clamp to avoid over-saturation, then apply intensity
    color = min(color, vec3(1.2));
    color *= intensity;

    gl_FragColor = vec4(color, 1.0);
  }
`;
