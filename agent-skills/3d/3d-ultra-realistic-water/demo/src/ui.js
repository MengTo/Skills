// Demo controller. Runs before the scene bundle; the bundle fills in
// __OD.waves / __OD.ocean / __OD.refl as it builds the ocean from ocean.mjs.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const OD = (window.__OD = {
    frozen: reduce.matches, // reduced motion: hold a composed still, keep controls live
    dirty: 0,
    t0: performance.now(),
    // true = skip this frame. Frozen scenes still render through the 2.6 s fade-in and after any change.
    hold() {
      if (!this.frozen) return false;
      if (this.dirty > 0) { this.dirty--; return false; }
      return performance.now() - this.t0 > 3200;
    },
    touch() { this.dirty = 2; },
  });
  reduce.addEventListener?.('change', (e) => { OD.frozen = e.matches; OD.touch(); });

  const $ = (id) => document.getElementById(id);
  const status = $('ow-status');
  const foot = $('ow-foot');
  const sea = $('ow-sea');
  const seaOut = $('ow-sea-out');
  const shotN = $('ow-shot-n');

  const describe = () => {
    const pixel = document.querySelector('input[name="ow-normals"]:checked').value === '1';
    if (!foot.checked && !pixel) return ['Footprint fade off and per-vertex normals: the far sea aliases and the glitter breaks into facets.', true];
    if (!foot.checked) return ['Footprint fade off: 3–8 m waves are sampled below their wavelength and alias into moiré toward the horizon.', true];
    if (!pixel) return ['Per-vertex normals: the glitter follows mesh facets and the short waves vanish past the near field.', true];
    if (+sea.value > 1.23) return ['Amplitude keeps rising; steepness is capped so the eight Q values still sum below 0.95.', false];
    return ['Every wave fades at its own pixel footprint.', false];
  };
  const refresh = () => {
    const [text, warn] = describe();
    if (status.textContent !== text) status.textContent = text;
    status.toggleAttribute('data-warn', warn);
    OD.touch();
  };

  foot.addEventListener('change', () => {
    if (OD.ocean) OD.ocean.uniforms.uFootprint.value = foot.checked ? 1 : 0;
    refresh();
  });
  document.querySelectorAll('input[name="ow-normals"]').forEach((r) =>
    r.addEventListener('change', () => {
      if (OD.ocean) OD.ocean.uniforms.uPixelNormals.value = +r.value;
      refresh();
    })
  );
  const setSea = () => {
    const v = +sea.value;
    seaOut.textContent = v.toFixed(2) + '×';
    sea.style.setProperty('--fill', ((v - +sea.min) / (+sea.max - +sea.min)) * 100 + '%');
    OD.waves?.setSeaState(v);
    refresh();
  };
  sea.addEventListener('input', setSea);
  setSea();
  // Called by the bundle once the ocean exists, so restored form state reaches the shader.
  OD.sync = () => {
    OD.ocean.uniforms.uFootprint.value = foot.checked ? 1 : 0;
    OD.ocean.uniforms.uPixelNormals.value = +document.querySelector('input[name="ow-normals"]:checked').value;
    setSea();
  };

  $('ow-next').addEventListener('click', () => {
    const rig = window.__ship?.rig;
    if (!rig) return;
    rig.setShot(rig.shot + 1);
    OD.touch();
    showShot(true);
  });
  // The rig cycles shots on its own; mirror its index without touching the DOM every frame.
  let lastShot = -1;
  const showShot = (announce) => {
    const rig = window.__ship?.rig;
    if (!rig || rig.shot === lastShot) return;
    lastShot = rig.shot;
    shotN.textContent = rig.shot + 1 + ' / 7';
    if (announce) status.textContent = 'Shot ' + (rig.shot + 1) + ' of 7.';
  };
  setInterval(() => showShot(false), 500);
})();
