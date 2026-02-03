---
name: unsplash-asset-images
description: Use when you need to pick high-quality Unsplash images for product/design assets (avatars, headshots, portraits, large website backgrounds, and abstract wallpapers) and output real Unsplash URLs plus practical instructions for producing the right resolutions and aspect ratios (1:1, 4:5, 3:4, 16:9, 9:16) via Unsplash source URLs or images.unsplash.com parameters.
---

# Unsplash Asset Images (Avatars, Portraits, Backgrounds, Wallpapers)

Goal: quickly grab *good-looking* images from Unsplash and deliver them in the **right size + ratio**.

## Output rule
For each recommendation, output:
1) **Unsplash page URL** (canonical)
2) **Quick-use image URL** (use `source.unsplash.com` with explicit dimensions)
3) Suggested **ratios + sizes** for the use case

## License / safety (keep it simple)
- Unsplash images are generally free to use, but **avoid Unsplash+** images unless the user explicitly wants them.
- Don’t present the photographer name as “required attribution” (Unsplash doesn’t require it), but it’s good practice to include.

---

## How to generate the right size + ratio

### A) Fastest: `source.unsplash.com` (good for prototypes)
Use the photo id from the URL.

Pattern:
```
https://source.unsplash.com/<PHOTO_ID>/<WIDTH>x<HEIGHT>
```
Examples:
- **1:1 avatar** (512×512): `…/512x512`
- **4:5 headshot** (1200×1500): `…/1200x1500`
- **16:9 hero background** (2400×1350): `…/2400x1350`
- **9:16 mobile background** (1080×1920): `…/1080x1920`

Notes:
- This endpoint can change the underlying crop over time. Use it for speed, not “final” marketing assets.

### B) Production: use `images.unsplash.com` (stable, controllable)
Workflow:
1) Open the Unsplash photo page
2) Click **Download**
3) Copy the `https://images.unsplash.com/photo-…` URL
4) Apply params:

Common params:
- `w=2400` (width)
- `h=1350` (height)
- `fit=crop`
- `crop=faces` (great for avatars/headshots)
- `q=80` (quality)
- `auto=format` (modern formats)

Example template:
```
<images.unsplash.com/photo-…>?auto=format&fit=crop&w=1200&h=1500&q=80
```

Recommended crops:
- **Avatars/headshots**: `crop=faces` + square / 4:5
- **Backgrounds**: no `crop=faces`, prefer wide crops, preserve horizon

---

## Curated picks (5 each)

### 1) Avatars (1:1)
Pick images with clean face framing + simple backgrounds.

1. https://unsplash.com/photos/man-wearing-black-shirt-aoEwuEH7YAs
   - Quick (512×512): https://source.unsplash.com/aoEwuEH7YAs/512x512
2. https://unsplash.com/photos/grayscale-photography-of-man-wearing-crew-neck-shirt-jmURdhtm7Ng
   - Quick (512×512): https://source.unsplash.com/jmURdhtm7Ng/512x512
3. https://unsplash.com/photos/grayscale-photography-of-woman-with-two-hands-on-her-face--Keh6vLM7w0
   - Quick (512×512): https://source.unsplash.com/-Keh6vLM7w0/512x512
4. https://unsplash.com/photos/man-in-black-crew-neck-shirt-QWa0TIUW638
   - Quick (512×512): https://source.unsplash.com/QWa0TIUW638/512x512
5. https://unsplash.com/photos/man-wearing-black-denim-jacket-near-building-2RFwLL-YX44
   - Quick (512×512): https://source.unsplash.com/2RFwLL-YX44/512x512

Suggested deliverables:
- 1:1: **256×256**, **512×512**, **1024×1024**
- If faces crop weird: use `images.unsplash.com` with `fit=crop&crop=faces` (see “Production” section).

### 2) Headshots (4:5 or 3:4)
Aim for shoulders-up framing, neutral backgrounds, “professional but human”.

1. https://unsplash.com/photos/mans-grey-and-black-shirt-ILip77SbmOE
   - Quick (1200×1500): https://source.unsplash.com/ILip77SbmOE/1200x1500
2. https://unsplash.com/photos/man-facing-on-left-side-co2Nn11OP3k
   - Quick (1200×1500): https://source.unsplash.com/co2Nn11OP3k/1200x1500
3. https://unsplash.com/photos/woman-with-blue-eyes-and-black-hair-VLJV46hPLSM
   - Quick (1200×1500): https://source.unsplash.com/VLJV46hPLSM/1200x1500
4. https://unsplash.com/photos/woman-with-blonde-hair-and-red-lipstick-8f3yvMdkWJI
   - Quick (1200×1500): https://source.unsplash.com/8f3yvMdkWJI/1200x1500
5. https://unsplash.com/photos/a-young-woman-poses-with-hands-near-her-face-bF6wuOivk2M
   - Quick (1200×1500): https://source.unsplash.com/bF6wuOivk2M/1200x1500

Suggested deliverables:
- 4:5: **800×1000**, **1200×1500**, **1600×2000**
- 3:4: **900×1200**, **1500×2000**

### 3) Portraits (editorial / candid)
Use these when the vibe is “human story”, not “corporate headshot”.

1. https://unsplash.com/photos/woman-holding-vintage-camera-to-take-a-picture-O_UK4X6ekgI
   - Quick (1200×1500): https://source.unsplash.com/O_UK4X6ekgI/1200x1500
2. https://unsplash.com/photos/man-wearing-a-straw-hat-and-maroon-shirt-Rd2UXAg8Zc0
   - Quick (1200×1500): https://source.unsplash.com/Rd2UXAg8Zc0/1200x1500
3. https://unsplash.com/photos/brPuA0a0Uuk
   - Base (w=2560): https://images.unsplash.com/photo-1486649567693-aaa9b2e59385?w=2560&q=80
4. https://unsplash.com/photos/Plii16U9bOU
   - Base (w=2560): https://images.unsplash.com/photo-1581182800629-7d90925ad072?w=2560&q=80
5. https://unsplash.com/photos/man-leaning-on-wall-silhouette-2trSyEqR0pA
   - Quick (1200×1500): https://source.unsplash.com/2trSyEqR0pA/1200x1500

Suggested deliverables:
- 3:4: **1500×2000**
- 4:5: **1200×1500**
- 1:1 crop for social: **1080×1080**

### 4) Large backgrounds (website hero, banners) — 16:9
Pick wide shots with clean negative space and readable gradients.

1. https://unsplash.com/photos/landscape-photography-of-mountains-twukN12EN7c
   - Base (w=2560): https://images.unsplash.com/photo-1635776063328-153b13e3c245?w=2560&q=80
2. https://unsplash.com/photos/a-black-landscape-with-mountains-in-the-background-X93tlrlx5kI
   - Base (w=2560): https://images.unsplash.com/photo-1655694774003-69c69d7ee5bb?w=2560&q=80
3. https://unsplash.com/photos/a-landscape-with-trees-and-mountains-in-the-background-96mTBTH9MEw
   - Base (w=2560): https://images.unsplash.com/photo-1669295384050-a1d4357bd1d7?w=2560&q=80
4. https://unsplash.com/photos/mountains-and-a-blue-sky-create-a-picturesque-landscape-fgCR4Yj3CLs
   - Quick (2400×1350): https://source.unsplash.com/fgCR4Yj3CLs/2400x1350
5. https://unsplash.com/photos/landscape-with-milky-way-night-sky-with-stars-on-the-mountain-long-exposure-photograph-with-grain-Vt7Se0uqEpA
   - Base (w=2560): https://images.unsplash.com/photo-1508615121316-fe792af62a63?w=2560&q=80

Suggested deliverables:
- Desktop hero: **1920×1080**, **2400×1350**, **2880×1620**
- Social banner: **1500×500** (3:1) — consider manual crop

### 5) Abstract wallpapers (desktop/mobile)
Use when you need “brand-safe”, non-specific visuals.

1. https://unsplash.com/photos/an-abstract-purple-background-with-a-black-background-5Q9Gf0WSyLk
   - Base (w=2560): https://images.unsplash.com/photo-1644426358812-879f02d1d867?w=2560&q=80
2. https://unsplash.com/photos/abstract-layered-shapes-with-a-gradient-orange-color-5q4zsTaVN4I
   - Desktop: https://source.unsplash.com/5q4zsTaVN4I/2880x1800
   - Mobile: https://source.unsplash.com/5q4zsTaVN4I/1080x1920
3. https://unsplash.com/photos/abstract-organic-shapes-with-blue-and-yellow-gradients-c0B1HYG6ZK4
   - Base (w=2560): https://images.unsplash.com/photo-1635776062360-af423602aff3?w=2560&q=80
4. https://unsplash.com/photos/blue-waves-form-a-soft-abstract-gradient-dYksH3vHorc
   - Desktop: https://source.unsplash.com/dYksH3vHorc/2880x1800
   - Mobile: https://source.unsplash.com/dYksH3vHorc/1080x1920
5. https://unsplash.com/photos/abstract-purple-waves-on-a-dark-background-ZQSPIiFEMoU
   - Desktop: https://source.unsplash.com/ZQSPIiFEMoU/2880x1800
   - Mobile: https://source.unsplash.com/ZQSPIiFEMoU/1080x1920

Suggested deliverables:
- Desktop: **2560×1600** or **2880×1800**
- Mobile: **1080×1920** (9:16)

---

## Quick “which ratio do I use?” cheatsheet
- **Avatar**: 1:1
- **Headshot card**: 4:5 (great default), 3:4 (taller)
- **Website hero background**: 16:9
- **Mobile wallpaper / story background**: 9:16

If the user asks for “best image”:
- prefer clean negative space
- avoid busy backgrounds
- ensure face is not cropped awkwardly (use `crop=faces` on production URLs)
