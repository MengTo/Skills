---
name: scroll-mesh-survey
description: "Scrub a narrow topology scan across a visible 3D object and its companion editorial figures. Use when a scroll gesture should disclose surface structure in both directions."
---

# Scroll Mesh Survey

Keep a legible solid silhouette at rest. Put a line mesh made from the same geometry under the same transformed parent as the shaded surface. For an already-visible object, alpha-blend just the lines at the wavefront. Reuse the geometry across passes and share any deformation uniforms so swaying tips stay registered.

Drive the front with section position. A practical progress value is `clamp((viewportHeight - sectionTop) / (viewportHeight + sectionHeight), 0, 1)`. Work in one coordinate system for both meshes. Project the vertex onto a normalized scan axis, then compare its coordinate with a front interpolated between the measured extremes. A radial version compares distance to an off-center origin. Use a soft band around that distance and let the line intensity settle after scrolling stops.

For an image-only companion figure, reveal the registered contour drawing through the same moving band. For editable prices and text, keep the original text node accessible and place any outline copy in an aria-hidden overlay. Reserve the bright response for the edges of the object.

Test by scrolling halfway, reversing, dwelling, and resizing. The outline should retrace the same surface without a flash, an opaque wipe, or rays crossing empty space. Reduced motion leaves the complete solid visible.

Open [the interactive study](demo/index.html) to inspect the technique.
