# A shared brief for helper agents (one window each)

Use this when several windows are built at once. Build the engine and one window yourself first; that window is the style guide. Then fill in the brackets below and give the same brief to every helper. Add a short section brief per helper (template at the end).

---

## Step windows for [page]: shared brief

You are building ONE section's live step window for [page] in [repo] ([stack]). The owner asked for the sections to show [product]'s real features the way the app does them, all around one example, [example], at the hero's level of quality: "[the owner's own words]". [The hero/style-guide files] already do this. Study them first: they are your style guide. Reuse their exported views and CSS classes where they fit.

### The contract (already built: [StepWindow file]; read it, don't change it)

- Your file exports an array of steps, `{ id, name, dur, View }`. `name` is 1–3 words shown in the bar under the window. `dur` is in seconds: 4–7 per step, 18–30 for the whole section.
- `View({ t, dur })` draws the window's content at 1200 × 750 design pixels. The window scales it to fit and draws its own title bar, so you draw only what's INSIDE the app window. Compute everything from `t` alone, so the same `t` gives the same frame. Use CSS transitions only to smooth between states. Use `ease(t, a, b)`, `typed()` and `<Cursor x y press hide move />` from [engine], and render the pointer last.
- The pointer does what a person would do (move, click, drag, type), with a press on every click.
- Each step needs a beat to see the start, the action, the result appearing as the app shows it (a working state, then the result), and about 1 s holding on the result. Under reduced motion each step shows at `t = dur`, so the end frame must be a complete, good picture on its own.
- The stage gives you the app's tokens [list] and fonts [list]. Icons: [how]. Only use names that exist.

### Look like the real UI

Reference pictures of the real app are listed in your section's brief. Open them, crop and zoom where you need to, and match the layout, sizes, labels, colours and wording. Text in the UI must be what the app really says. Find it in the source with grep. Never write lorem, and never invent UI.

### Hard rules

- CREATE ONLY your two files ([prefix-named jsx and css]). Don't modify, stage, commit or delete anything else. Many sessions share this checkout, so run no git commands that change anything.
- Prefix every CSS class and @keyframes name with your prefix, and grep the source to be sure nothing else uses it.
- Assets: only files already in [public folder]. Don't add images, call paid APIs or generate anything.
- Scratch work goes only in your own folder, [scratch]/<prefix>/. Don't start servers; one preview server is running for you.

### Previewing

A dev server runs at [url] (don't stop it). It mounts any entry file at `[url]/preview?entry=<absolute path>`. Copy [sample entry] into your folder, import your steps and render the window at about 820 px wide, as the page will. Shoot it with `node [shoot script] <entry> <out prefix> <seconds…>` (2× PNGs). Shoot many moments, every 0.5–1 s through each step, and LOOK at them. To check one step's end frame, render only that step.

### Quality bar (be your own harsh critic)

Compare your frames side by side with the references. Would someone who uses [product] believe this is [product], recorded? Check the same rail and bar, the same panel widths and type sizes, real labels, real pictures and nothing made up. Motion should be eased and calm, nothing should pop, and the pointer should move like a person's. Do at least three rounds of shoot → critique → fix. Then run the formatter on just your two files, and make sure there are no console errors.

### Report

Report your export name, the steps (id, name, dur, what happens), which references you matched, screenshot paths for each step's key moment and end frame, and what still falls short. Be honest about the last one: it's the next round.

---

## A section brief (one per helper)

YOUR SECTION: [numeral], "[title]". The owner's words: "[quote]". All on [example].

Files you create: [path]/steps[Name].jsx (export `[NAME]_STEPS`) and steps[Name].css. CSS prefix: `[x..-]`. Scratch folder: [scratch]/[prefix]/. Window tab: ['[tab]'].

Steps, in this order (names as shown in the bar):
1. "[Name]": [what the app shows, what the pointer does, what result appears and how; the result file to use].
2. …
Each step [n]–[m] s; about [total] s in all.

References of the real UI (open them): [screenshots], [docs recordings and their .mp4 for frames], [source files for wording]. [Any pictures that show real customer or partner content: copy the UI only, never their content.]

## Running them

- Start helpers in the background, one per section, together. Give each its own prefix and scratch folder.
- They stop when the usage limit hits. Their work so far is kept, so resume each one with a message ("the limit has reset: continue from where you stopped") rather than starting it again.
- When a helper reports, open its screenshots yourself before wiring the window into the page. Its "what still falls short" list is the next round's brief.
- A shared piece (a landing page component two windows show) lives in one helper's file and is exported. Tell the second helper to import it, never copy it.
