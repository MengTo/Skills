// Worked example: rebuilds examples/dev-stack.svg ("Dev Stack") with iso.mjs.
//   node scripts/dev-stack.gen.mjs out.svg        (run from the skill folder)
// Read it as the template for a new card: layout table -> shadows and glows -> flushFloor -> objects back to front.
import * as I from './iso.mjs';
const { K, MG, MT, DG, M, box, circle, rectFoot, castShadow, glow } = I;

I.init('s12-');
I.floorDefs();

// ---------------- layout (plan units; the platform spans -122..122) ----------------
const R1 = { x0: -100, x1: -66, y0: -100, y1: -68, h: 84 };   // tall rack, back left
const R2 = { x0: -58, x1: -24, y0: -100, y1: -68, h: 68 };    // shorter rack beside it
const DB = { x: 22, y: -88, r: 17.5 };                        // database stack, back
const CT = { x0: 74, x1: 106, y0: -70, y1: -8, h: 27 };       // shipping container, right
const LP = { x0: -44, x1: 30, y0: 8, y1: 58 };                // laptop, centre (the hero)
const MUG = { x: 70, y: 90, r: 10.2 };                        // mug, front right
const CARD = { x0: -112, x1: -54, y0: 57, y1: 97 };           // terminal card, front left
const CLOUD = { x: 51, y: 42, d: 10, s: 1.3 };                // cloud badge, mid right
const BOOKS = { x: 6, y: 95.5, s: 1.18 };                     // book stack, front

// cables: [x, y, z] plan points; z 1.1 lies on the slab, the last points climb into the port
const portX = -83;
const cableA = [[-48, 46, 1.6], [-52.5, 46.1, 1.2], [-60, 46.5, 1.1], [-78, 38, 1.1], [-94, 14, 1.1], [-102, -14, 1.1], [-100, -42, 1.1],
  [-91, -56, 1.1], [portX, R1.y1 + 6.5, 1.6], [portX, R1.y1 + 3.6, 4.4], [portX, R1.y1 + 1.4, 6.2]];
const cableB = [[R2.x1 + 1.4, -86, 6.2], [R2.x1 + 3.6, -86, 4.4], [R2.x1 + 6.5, -86, 1.6], [-10, -87, 1.1], [-1, -90, 1.1], [3.5, -92.3, 2.2], [5.6, -93.6, 4.6]];

// ---------------- floor: slab, cast shadows (light from -x), glows, contact pools ----------------
I.platform();
castShadow(rectFoot(R1.x0, R1.x1, R1.y0, R1.y1), R1.h * 0.35, 0.62, 0.26);
castShadow(rectFoot(R2.x0, R2.x1, R2.y0, R2.y1), R2.h * 0.45, 0.62, 0.26);
castShadow(circle(DB.x, DB.y, DB.r, 8), 42, 0.62, 0.24);
castShadow(rectFoot(CT.x0, CT.x1, CT.y0, CT.y1), CT.h, 0.62, 0.24);
castShadow(rectFoot(LP.x0, LP.x1, LP.y0 - 8, LP.y1), 26, 0.62, 0.22);
castShadow(circle(MUG.x, MUG.y, MUG.r + 5, 8), 20, 0.62, 0.24);
castShadow(rectFoot(CARD.x0, CARD.x1, CARD.y0, CARD.y1), 8, 0.7, 0.2);
castShadow(rectFoot(CLOUD.x + 2, CLOUD.x + 36 * CLOUD.s, CLOUD.y - CLOUD.d, CLOUD.y), 24 * CLOUD.s, 0.62, 0.24);
glow((LP.x0 + LP.x1) / 2, LP.y1 + 6, 52, 30, MG, 0.5);          // screen spill in front of the laptop
glow((R1.x0 + R2.x1) / 2, R1.y1 + 14, 48, 22, MG, 0.46);        // rack LEDs
glow((CARD.x0 + CARD.x1) / 2, (CARD.y0 + CARD.y1) / 2, 40, 32, MG, 0.52);
glow(MUG.x, MUG.y, MUG.r + 9, MUG.r + 9, DG, 0.34);             // dark contact pools under small objects
glow(BOOKS.x, BOOKS.y, 25, 19, DG, 0.3);
glow(CLOUD.x + 18 * CLOUD.s, CLOUD.y - CLOUD.d / 2, 28, 11, DG, 0.32);
castShadow(rectFoot(BOOKS.x - 21, BOOKS.x + 21, BOOKS.y - 15, BOOKS.y + 15), 19, 0.62, 0.24);
I.cableShadow(cableB, { thin: true });
I.cableShadow(cableA);
I.flushFloor();

// ---------------- objects, back (small x + y) to front (large x + y) ----------------
I.rack(R1, 1);
I.rack(R2, 2);
I.cable(cableA);
box(portX - 3, portX + 3, R1.y1, R1.y1 + 2.6, 3.6, 8.8, M.pale, { sw: 0.7 });       // plug on the rack face
I.cable(cableB, { thin: true });
box(R2.x1, R2.x1 + 2.4, -89, -83, 3.8, 8.6, M.pale, { sw: 0.7 });
I.database(DB);
I.container(CT);
box(LP.x0 - 6, LP.x0, 44.2, 47.8, 0.5, 2.9, M.pale, { sw: 0.6 });                  // laptop plug
I.laptop(LP);
I.mug(MUG);
I.cloudBadge(CLOUD);
I.card(CARD);
I.books(BOOKS);

I.writeSVG(process.argv[2] || 'dev-stack.svg', process.argv[3]);
