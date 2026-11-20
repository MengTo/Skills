# Building the sanctuary

## Choose the representation by viewing distance

The early sanctuary used five image-to-3D reconstructions, each from one source image, through Higgsfield’s Multi-Image to 3D route. They were a torii gate, a stone lantern, the first pagoda, a bare maple trunk and a western crag. The leaf PNGs supplied opacity and color to folded geometry. The original pagoda appeared twice in an early build. Both walk-up temples were subsequently modeled from scratch. Keep an asset ledger with the source, method, viewing distance, modifications and credit. Use it to answer provenance questions accurately.

For a new environment, choose its closest viewing position before choosing the asset pipeline. A roof, underside, carved opening or bridge joint that the player can see through needs modeled depth. A detached surface specimen can begin as a neutral, isolated image. With a Seedream 5.5 transparency request, inspect the decoded alpha channel and the edge against light and dark backgrounds. Printed stamps need genuine gaps between ink marks, and leaf stems must survive cutout and mipmapping.

## Architecture that bears weight

Build the courtyard tower and far-bank hall as distinct buildings. Set each foundation onto its walking surface. Lay out bays and columns, then bracket arms and bearing blocks, roof curves, rafters, pan tiles and overlapping caps. Add shoji lattice with paper set back from the frame. Model a door partly open so the interior has a visible depth cue. Give the distant buildings enough stepped roof geometry to read in silhouette.

Trace light against the full building. Kasumidera baked directional incoming light around each walk-up temple. The rafter recess, end grain and fascia respond differently to the same courtyard sky. A rear opening and a shielded lamp illuminate a few paper panes from behind. Protect the deep joints while retaining readable wood at the eave.

For a bridge, follow one deck load down through its fastener, crossbeam and arch rib to a stone seat. Break repetition with an identifiable repair bay. Kasumidera used crossboards beside lengthwise repair boards. Place end grain, iron straps, bronze finials, hand rub and debris where the construction explains them. Sample the rendered deck through its camber and verify player height and rail collision. Classify a designed drainage gap separately from an unsupported walkable area.

## Wear, grain and color

Use the Poly Haven hinoki scan for the warm walking boards, Japanese cedar for rail bodies and peeling timber as a finish study. Choose different strips of the sample for neighboring members. Keep long grain parallel to the member and add end grain to the cuts. Read color maps as sRGB and normal, height and roughness maps as linear data. Use anisotropic filtering on the deck where it recedes at a grazing angle.

On a lacquered column, begin with cedar showing through sparse fine chips. Place broader abrasion near feet, corners and hand contact. Couple the chip outline to a shallow edge in relief. Let intact lacquer catch a narrow irregular highlight and exposed grain scatter it. Test the response with moving light or a changing viewpoint. A hand-painted dark chip on an otherwise unbroken highlight still reads as paint on the photograph.

Test albedo, relief and roughness independently on the warm baseline. For stair noses, model missing corners below the walking surface, polish the rubbed edge and let moss settle into recesses. Use the same mineral scale on a boulder and the cliff that shed it.

## Build depth in the landscape and air

Start with broad ridgelines at distinct distances. The project adapted Hida elevation and aerial data for the main shape, used additional regional elevation for the far range, and spent survey geometry on the nearest buttresses. Cut bedding planes across adjacent faces. Continue fractures around corners, recompute shared normals and re-seat roots and firs after displacement. Test the open silhouette and its cast shadow. A plausible near cliff needs an outcrop you can recognize again from another viewpoint.

Keep separate density fields for the low inversion and cloud in the upper pass. Intersect each volume with the view ray. Limit its far distance using the opaque scene depth in the same coordinate system. Integrate optical depth along the segment, using transmittance T = exp(−Σ density × extinction × step length). Use light visibility along the sun direction to shape scatter. Leave clear intervals where a dark intervening ridge shows through the bank.

Keep incense smoke local to the censer, with a narrow source and a widening drifting plume. Place dust in illuminated pockets. Let near maple leaves rotate around their own axes as they fall and pass behind posts. Inspect occlusion while the player moves. A screenshot alone cannot establish whether these effects occupy the correct depth.

For near trees, carry bark coordinates across branch junctions, give leaves petioles, model blade folds and vary transmission with thickness. Use botanical mesh or scan detail for the windward fir, then switch to a cheaper representation at distance. Preserve gaps between boughs. In dense stands, group instances spatially so off-camera crowns can be culled.

## Settle a disagreement with an inspection

- **More polygons, still soft.** Check the silhouette, actual texel density and lighting separately. Move the light across a fracture before increasing subdivisions.
- **Hero prop disappears on one device.** Check shader compilation and texture-unit limits. Kasumidera restored the gate by sharing a footing sample and removing a redundant metallic input.
- **A new pass scores well and looks wrong to the creator.** Reapply the approved base color to the new geometry. Repeat the same cameras. Retain improvements that survive that comparison.
- **The route reads poorly in motion.** Review the turn into the bridge at walking height. Keep an entrance post and the far doorway legible as the camera clears the stone arch. Test the same corner while running.

In the first gate review, the scene earned 4.2/10. The flat beige light cost more points than the low-detail stone. Clearing the view below the gate beam and putting sunlight across the step edges brought the next review to 6.45/10. Later canopy edits hid part of the upper roof again. Keep the already approved sightline in every comparison, even when the current pass targets a different object.
