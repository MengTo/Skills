import { makePaintRenderer } from "./paint-renderer.js";

async function loadMap(url) {
  const image = new Image();
  image.src = url;
  await image.decode();
  return image;
}

// Each plate image fills a positioned wrapper. Apply rotation and scale to
// that wrapper so the base paint, probes and difference canvas share a plane.
export function createPaintLighting(stage, plates) {
  let renderer,
    frame = 0,
    stopped = false,
    visible = false,
    failed = false;
  let aim = null,
    following = false,
    lastDraw = -Infinity;
  const media = matchMedia(
    "(hover: hover) and (prefers-reduced-motion: no-preference)",
  );
  const events = new AbortController();
  function clearPaint() {
    for (const layer of layers) layer.canvas.hidden = true;
  }
  function cancel() {
    cancelAnimationFrame(frame);
    frame = 0;
  }
  function reset() {
    cancel();
    aim = null;
    following = false;
    clearPaint();
  }
  function schedule() {
    if (!stopped && !failed && !frame && visible && !document.hidden && aim) {
      frame = requestAnimationFrame(draw);
    }
  }
  const layers = plates.map(
    ({ image, normal, depth, roughness, metal = 0 }) => {
      const wrapper = image.parentElement;
      const canvas = document.createElement("canvas");
      canvas.hidden = true;
      canvas.setAttribute("aria-hidden", "true");
      Object.assign(canvas.style, {
        position: "absolute",
        inset: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      });
      wrapper.append(canvas);
      const corners = [
        [0, 0],
        [100, 0],
        [0, 100],
      ].map(([x, y]) => {
        const probe = document.createElement("i");
        probe.setAttribute("aria-hidden", "true");
        Object.assign(probe.style, {
          position: "absolute",
          left: x + "%",
          top: y + "%",
          width: "0",
          height: "0",
          pointerEvents: "none",
        });
        wrapper.append(probe);
        return probe;
      });
      return {
        image,
        wrapper,
        canvas,
        ctx: canvas.getContext("2d"),
        corners,
        metal,
        urls: [normal, depth, roughness],
        map: null,
        loading: false,
      };
    },
  );
  function draw(now) {
    frame = 0;
    if (!visible || !aim || stopped || failed || document.hidden) return;
    if (now - lastDraw < 30) {
      schedule();
      return;
    }
    lastDraw = now;
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    if (!renderer) {
      try {
        renderer = makePaintRenderer(() => {
          failed = true;
          reset();
        });
      } catch {
        failed = true;
      }
      if (!renderer) {
        failed = true;
        return;
      }
    }
    for (const layer of layers) {
      if (!layer.map) {
        if (!layer.loading) {
          layer.loading = true;
          Promise.all([layer.image.decode(), ...layer.urls.map(loadMap)])
            .then(([, normal, depth, roughness]) => {
              if (stopped) return;
              layer.map = { paint: layer.image, normal, depth, roughness };
              schedule();
            })
            .catch(() => {
              layer.canvas.hidden = true;
            });
        }
        continue;
      }
      const { image, canvas, corners } = layer;
      const w = image.clientWidth,
        h = image.clientHeight;
      if (!w || !h) continue;
      const dpr = Math.min(devicePixelRatio, 1.25, 1280 / w, 960 / h);
      const bw = Math.max(1, Math.round(w * dpr)),
        bh = Math.max(1, Math.round(h * dpr));
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      const [o, x, y] = corners.map((el) => el.getBoundingClientRect());
      const project = (dx, dy) =>
        (0.85 * dx) / rect.width - (0.53 * dy) / rect.height;
      const axis = [
        project(x.x - o.x, x.y - o.y) / w,
        project(y.x - o.x, y.y - o.y) / h,
        project(o.x - rect.left, o.y - rect.top) - 0.16,
      ];
      renderer.draw(
        layer.map,
        layer,
        [0, 0, w, h],
        [0, 0, w, h],
        aim,
        axis,
        layer.metal,
      );
      canvas.hidden = false;
    }
  }
  function setLight(x, y) {
    following = false;
    aim = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
    schedule();
  }
  let pointerEnabled = true;
  const opts = { signal: events.signal, passive: true };
  stage.addEventListener(
    "pointermove",
    (event) => {
      if (!pointerEnabled || !media.matches || event.pointerType === "touch")
        return;
      const r = stage.getBoundingClientRect();
      if (!r.width || !r.height) return;
      setLight(
        (2 * (event.clientX - r.left)) / r.width - 1,
        1 - (2 * (event.clientY - r.top)) / r.height,
      );
      following = true;
    },
    opts,
  );
  function stopFollowing() {
    if (following) reset();
  }
  stage.addEventListener("pointerleave", stopFollowing, opts);
  stage.addEventListener("pointercancel", stopFollowing, opts);
  media.addEventListener("change", stopFollowing, opts);
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) cancel();
      else schedule();
    },
    opts,
  );
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) schedule();
    else cancel();
  });
  observer.observe(stage);
  const resize = new ResizeObserver(schedule);
  resize.observe(stage);
  for (const layer of layers) resize.observe(layer.image);
  return {
    setLight,
    reset,
    refresh: schedule,
    enablePointer(value) {
      pointerEnabled = Boolean(value);
      if (!value) reset();
    },
    dispose() {
      stopped = true;
      reset();
      events.abort();
      observer.disconnect();
      resize.disconnect();
      for (const { canvas, corners } of layers) {
        canvas.remove();
        corners.forEach((el) => el.remove());
      }
      renderer?.close();
    },
  };
}
