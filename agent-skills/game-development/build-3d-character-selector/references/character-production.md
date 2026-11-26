# From a portrait to a browser-ready character

## The project's production route

The driving game developed four original identities. An approved portrait fixed the face and styling of each person. Seedream 5.5 produced one full-length reference per character. Those full-body images drove the textured image-to-3D runs in Tripo H3.1 through Higgsfield. The stage displays a mesh that can be viewed from behind.

| Character | Visual anchors to preserve | Master triangles | Stage triangles |
| --- | --- | ---: | ---: |
| Stan, the Fixer | Black-and-silver undercut, titanium ear implant, worn technical jacket, cognac collar, brass hardware | 1,911,388 | 468,289 |
| Kintsugi Courier | Asymmetric black bob, ceramic riding jacket with gold repair seams, red collar | 1,961,861 | 372,753 |
| Signal Diver | Short platinum hair, amber hood folded down, grey storm shell and tubing collar | 1,871,904 | 355,660 |
| Night Archivist | Hair in a bun, plum cloak, silver temple interface and mechanical forearm | 1,973,450 | 374,955 |

These measured counts describe the featured turntable assets. For background crowds or older phones, choose a lower-detail tier based on screen coverage, texture memory and frame time.

## Produce the reference

Write a short casting card with a face, a readable silhouette, one signature material and one accessory that will still read in profile. Use an original or authorized identity image. For an existing cast, preserve each person's age, features, hair and identifying marks across the portrait and full-body references.

A reusable image brief:

> Match the adult character in the supplied identity reference. Show one figure, straight on, from the top of the hair to the soles of both boots with margin on all sides. Use a relaxed slight A-pose, open hands, space between each elbow and waist, and space between the boots. Keep [face and hair], [signature material and garment], and [asymmetric accessory and side]. Use a plain neutral studio background, soft even light, readable seams and clear facial detail. Keep the floor free of props, labels and graphic effects.

Review hand separation, both shoes, accessory side, and facial identity before sending the image to 3D. Resolve a cropped boot or merged hand in this cheaper reference stage. Keep the lighting neutral enough to distinguish material color from shadows.

## Generate and inspect the master

For the recorded Tripo H3.1 runs, the input was one approved full-body image. The job settings were:

```json
{
  "geometry_quality": "detailed",
  "texture_quality": "detailed",
  "texture": true,
  "pbr": true,
  "face_limit": 2000000,
  "orientation": "align_image",
  "texture_alignment": "original_image"
}
```

When repeating the process in another provider version, map these settings to its supported fields and inspect the estimate before spending credits. Save the input reference, prompt, actual provider/model, returned master and material information together. If a paid job fails, inspect its status before retrying.

Orbit the raw GLB through four sides. Check that the face is recognizable, straps sit on the body, soles have volume, and the back of the jacket holds up close. A single image leaves the back design to the generator; use approved additional views with a compatible generator when markings must match.

## Prepare the browser copy

The project retained the textured master and made a separate decimated mesh in Blender, weighting the face, ears and fingertips more heavily. It paired those reduced vertices, normals, UVs and indices with material maps from the master. Facing corrections were set per character after inspection. Both full and smaller texture sets were packaged, and the single HTML file decodes the selected character on demand. For a conventional multi-file build, GLB and lazy texture loading serve the same purpose.

The masters used for this selector were unrigged. A small vertex-shader deformation supplied breathing and gaze, and stage rotation showed the whole sculpt. If a character must walk, gesture or drive, add a skeleton, bind and paint weights on a working copy, then test shoulders, elbows, hips, knees and any rigid accessories against the actual animation clips. Preserve the master and distinguish stage motion from skeletal clips when handing off the assets.
