---
name: unsplash-asset-images
description: Use when you need to pick high-quality Unsplash images for product/design assets (avatars, headshots, portraits, large website backgrounds, and abstract wallpapers) and output real Unsplash URLs plus practical instructions for producing the right resolutions and aspect ratios (1:1, 4:5, 3:4, 16:9, 9:16).
---

# Unsplash Asset Images (Avatars, Portraits, Backgrounds, Wallpapers)

Goal: quickly grab *good-looking* images from Unsplash and deliver them in the **right size + ratio**.

## Output rule
For each recommendation, output:
1) **Unsplash page URL** (canonical)
2) Suggested **ratios + sizes** for the use case

If the user wants a file, instruct them to use the **Download** button on Unsplash and then crop/resize in their design tool or image pipeline.

## License / safety (keep it simple)
- Unsplash images are generally free to use, but **avoid Unsplash+** images unless the user explicitly wants them.
- Don’t present the photographer name as “required attribution” (Unsplash doesn’t require it), but it’s good practice to include.

---

## How to deliver the right size + ratio

1. Open the Unsplash photo page and use the **Download** button.
2. Resize/crop to the target ratio in your design tool or image pipeline.
3. Keep faces centered for avatars/headshots and preserve horizon for wide backgrounds.

Note: do not include Unsplash source or secondary image links; keep only the main photo page URLs.

---

## Curated picks (5 each)

### 1) Avatars (1:1)
Pick images with clean face framing + simple backgrounds.

1. https://unsplash.com/photos/man-wearing-black-shirt-aoEwuEH7YAs
2. https://unsplash.com/photos/grayscale-photography-of-man-wearing-crew-neck-shirt-jmURdhtm7Ng
3. https://unsplash.com/photos/grayscale-photography-of-woman-with-two-hands-on-her-face--Keh6vLM7w0
4. https://unsplash.com/photos/man-in-black-crew-neck-shirt-QWa0TIUW638
5. https://unsplash.com/photos/man-wearing-black-denim-jacket-near-building-2RFwLL-YX44

Suggested deliverables:
- 1:1: **256×256**, **512×512**, **1024×1024**

### 2) Headshots (4:5 or 3:4)
Aim for shoulders-up framing, neutral backgrounds, “professional but human”.

1. https://unsplash.com/photos/mans-grey-and-black-shirt-ILip77SbmOE
2. https://unsplash.com/photos/man-facing-on-left-side-co2Nn11OP3k
3. https://unsplash.com/photos/woman-with-blue-eyes-and-black-hair-VLJV46hPLSM
4. https://unsplash.com/photos/woman-with-blonde-hair-and-red-lipstick-8f3yvMdkWJI
5. https://unsplash.com/photos/a-young-woman-poses-with-hands-near-her-face-bF6wuOivk2M

Suggested deliverables:
- 4:5: **800×1000**, **1200×1500**, **1600×2000**
- 3:4: **900×1200**, **1500×2000**

### 3) Portraits (editorial / candid)
Use these when the vibe is “human story”, not “corporate headshot”.

1. https://unsplash.com/photos/woman-holding-vintage-camera-to-take-a-picture-O_UK4X6ekgI
2. https://unsplash.com/photos/man-wearing-a-straw-hat-and-maroon-shirt-Rd2UXAg8Zc0
3. https://unsplash.com/photos/brPuA0a0Uuk
4. https://unsplash.com/photos/Plii16U9bOU
5. https://unsplash.com/photos/man-leaning-on-wall-silhouette-2trSyEqR0pA

Suggested deliverables:
- 3:4: **1500×2000**
- 4:5: **1200×1500**
- 1:1 crop for social: **1080×1080**

### 4) Large backgrounds (website hero, banners) — 16:9
Pick wide shots with clean negative space and readable gradients.

1. https://unsplash.com/photos/landscape-photography-of-mountains-twukN12EN7c
2. https://unsplash.com/photos/a-black-landscape-with-mountains-in-the-background-X93tlrlx5kI
3. https://unsplash.com/photos/a-landscape-with-trees-and-mountains-in-the-background-96mTBTH9MEw
4. https://unsplash.com/photos/mountains-and-a-blue-sky-create-a-picturesque-landscape-fgCR4Yj3CLs
5. https://unsplash.com/photos/landscape-with-milky-way-night-sky-with-stars-on-the-mountain-long-exposure-photograph-with-grain-Vt7Se0uqEpA

Suggested deliverables:
- Desktop hero: **1920×1080**, **2400×1350**, **2880×1620**
- Social banner: **1500×500** (3:1) — consider manual crop

### 5) Abstract wallpapers (desktop/mobile)
Use when you need “brand-safe”, non-specific visuals.

1. https://unsplash.com/photos/an-abstract-purple-background-with-a-black-background-5Q9Gf0WSyLk
2. https://unsplash.com/photos/abstract-layered-shapes-with-a-gradient-orange-color-5q4zsTaVN4I
3. https://unsplash.com/photos/abstract-organic-shapes-with-blue-and-yellow-gradients-c0B1HYG6ZK4
4. https://unsplash.com/photos/blue-waves-form-a-soft-abstract-gradient-dYksH3vHorc
5. https://unsplash.com/photos/abstract-purple-waves-on-a-dark-background-ZQSPIiFEMoU

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
