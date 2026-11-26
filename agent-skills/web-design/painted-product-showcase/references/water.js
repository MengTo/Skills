/* A moving optical field samples the original photograph only inside the waterline. */
export function startWater() {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const vertex = `#version 300 es
    out vec2 screenUv;
    void main() {
      vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
      screenUv = vec2((p.x + 1.0) * .5, (1.0 - p.y) * .5);
      gl_Position = vec4(p, 0, 1);
    }`;
  const fragment = `#version 300 es
    precision highp float;
    in vec2 screenUv;
    out vec4 color;
    uniform sampler2D photo, mask;
    uniform vec2 span, origin;
    uniform float t, horizon, strength;
    void main() {
      vec2 uv = origin + screenUv * span;
      if (uv.y < horizon) discard;
      float wet = texture(mask, uv).r;
      if (wet < .006) discard;
      float depth = clamp((uv.y-horizon)/(1.0-horizon),0.0,1.0);
      float distanceFade = smoothstep(.008,.19,depth);
      // Perspective compresses wave spacing towards the far shore.
      vec2 plane = vec2((uv.x-.5)/(depth+.36), 1.0/(depth+.36));
      float broad = sin(15.7*plane.y + 3.5*plane.x - .82*t);
      float crossWind = sin(27.3*plane.y - 9.0*plane.x + 1.16*t + .8*broad);
      float ripple = sin(58.1*plane.y + 12.7*plane.x - 1.53*t + 1.5*crossWind);
      float fine = sin(102.3*plane.y - 16.1*plane.x + 1.87*t + 1.9*ripple);
      float swell = .48*broad + .32*crossWind + .15*ripple + .05*fine;
      float amplitude = distanceFade * (.14 + .86*depth) * strength * wet;
      vec2 bend = vec2(.00155*(.6*crossWind+.4*ripple), .0056*swell) * amplitude;
      vec3 reflected = texture(photo, clamp(uv + bend, vec2(.0003), vec2(.9997))).rgb;
      float luma = dot(reflected, vec3(.2126,.7152,.0722));
      // Modulate glints already in the image, preserving its light direction.
      float glint = smoothstep(.27,.81,luma) * (.52*ripple + .48*fine);
      reflected += amplitude * (.031*glint + .006*swell);
      color = vec4(reflected, wet);
    }`;

  function makeRenderer(plate, photo, shoreline) {
    const canvas = plate.querySelector("canvas");
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: "low-power",
    });
    if (!gl) return null;
    const program = gl.createProgram();
    for (const [kind, source] of [
      [gl.VERTEX_SHADER, vertex],
      [gl.FRAGMENT_SHADER, fragment],
    ]) {
      const shader = gl.createShader(kind);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      gl.attachShader(program, shader);
      gl.deleteShader(shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return null;
    }
    gl.useProgram(program);
    const uniforms = {};
    for (const name of [
      "photo",
      "mask",
      "span",
      "origin",
      "t",
      "horizon",
      "strength",
    ])
      uniforms[name] = gl.getUniformLocation(program, name);
    [photo, shoreline].forEach((image, unit) => {
      const texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      );
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.uniform1i(unit ? uniforms.mask : uniforms.photo, unit);
    });
    const lake = plate.classList.contains("lake-water");
    const horizon = lake ? 0.523 : 0.535;
    gl.uniform1f(uniforms.horizon, horizon);
    gl.uniform1f(uniforms.strength, lake ? 0.8 : 1.0);
    let scissorHeight = 0;
    function resize() {
      const w = plate.clientWidth,
        h = plate.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(devicePixelRatio, 1.5, 2400 / Math.max(w, h));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      const scale = Math.max(w / photo.naturalWidth, h / photo.naturalHeight);
      const sx = w / (scale * photo.naturalWidth),
        sy = h / (scale * photo.naturalHeight);
      const style = getComputedStyle(plate);
      const ox = (1 - sx) * parseFloat(style.getPropertyValue("--focus-x"));
      const oy = (1 - sy) * parseFloat(style.getPropertyValue("--focus-y"));
      gl.uniform2f(uniforms.span, sx, sy);
      gl.uniform2f(uniforms.origin, ox, oy);
      scissorHeight = Math.min(
        canvas.height,
        Math.max(0, Math.ceil(canvas.height * (1 - (horizon - oy) / sy)) + 1),
      );
    }
    const observer = new ResizeObserver(resize);
    observer.observe(plate);
    resize();
    return {
      draw(seconds) {
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(0, 0, canvas.width, scissorHeight);
        gl.uniform1f(uniforms.t, seconds);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
      disconnect() {
        observer.disconnect();
      },
    };
  }

  for (const plate of document.querySelectorAll(".water-plate")) {
    const photo = plate.querySelector("img"),
      canvas = plate.querySelector("canvas");
    const toggle = plate.parentElement.querySelector(".demo-play");
    let visible = false,
      ready = null,
      renderer = null,
      tick = 0,
      elapsed = 0,
      last = 0;
    const allowed = () =>
      visible &&
      !document.hidden &&
      !reduced.matches &&
      toggle.dataset.enabled !== "false";
    function frame(now) {
      tick = 0;
      if (!allowed()) return;
      if (!last || now - last >= 1000 / 30 - 0.8) {
        elapsed += last ? Math.min(now - last, 80) / 1000 : 0;
        renderer.draw(elapsed);
        plate.classList.add("is-flowing");
        last = now;
      }
      tick = requestAnimationFrame(frame);
    }
    async function sync() {
      if (!allowed()) {
        cancelAnimationFrame(tick);
        tick = 0;
        last = 0;
        if (reduced.matches) plate.classList.remove("is-flowing");
        return;
      }
      if (!ready) {
        const mask = new Image();
        mask.src = plate.dataset.mask;
        ready = Promise.all([photo.decode(), mask.decode()])
          .then(() => makeRenderer(plate, photo, mask))
          .catch(() => null);
      }
      renderer = await ready;
      if (renderer && allowed() && !tick) tick = requestAnimationFrame(frame);
    }
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      cancelAnimationFrame(tick);
      tick = 0;
      last = 0;
      plate.classList.remove("is-flowing");
      renderer?.disconnect();
      renderer = null;
      ready = Promise.resolve(null);
    });
    canvas.addEventListener("webglcontextrestored", () => {
      ready = null;
      sync();
    });
    new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { root: document.querySelector(".page") },
    ).observe(plate);
    new MutationObserver(sync).observe(toggle, {
      attributes: true,
      attributeFilter: ["data-enabled"],
    });
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
  }
}
