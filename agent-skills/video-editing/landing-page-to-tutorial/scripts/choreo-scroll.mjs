// Choreography for record-window.mjs: hold on the hero, one eased scroll to the bottom, hold on the footer.
// SCROLL_SECS (env) sets the scroll's length; HOLD_SECS the holds. Total --dur should be HOLD + SCROLL + HOLD + 1.
const HOLD = +(process.env.HOLD_SECS || 2);
const SCROLL = +(process.env.SCROLL_SECS || 24);

export async function setup(page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(2500);
  const { width, height } = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
  await page.mouse.move(width + 40, height + 40); // park the pointer off the page
}

export async function run(page, at) {
  await at(HOLD);
  await page.evaluate(async (secs) => {
    const io = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const y1 = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    const t0 = performance.now();
    await new Promise((done) => {
      const tick = () => {
        const k = Math.min(1, (performance.now() - t0) / (secs * 1000));
        window.scrollTo(0, y1 * io(k));
        if (k < 1) requestAnimationFrame(tick); else done();
      };
      requestAnimationFrame(tick);
    });
  }, SCROLL);
  await at(HOLD + SCROLL + HOLD);
}
