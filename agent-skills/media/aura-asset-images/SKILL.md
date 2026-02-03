---
name: aura-asset-images
description: "Use when you need high-quality stock-style images from Aura Assets (aura.build/assets) similar to Unsplash for design mockups and marketing: backgrounds, abstract wallpapers, architecture, portraits, and headshots. Includes a workflow for searching by tag on aura.build/assets and returns 5 real image URLs per category plus practical guidance for using different resolutions and aspect ratios."
---

# Aura Asset Images (Unsplash-style)

Aura has a big searchable asset library at:
- https://www.aura.build/assets

Use it like Unsplash: search by tag, pick 5 strong candidates, and return direct image URLs.

## How to search (fast)
1) Open: https://www.aura.build/assets
2) Use the search box or URL query:
   - `https://www.aura.build/assets?q=<tag>&order=popular`
3) Tags that work well: `background`, `abstract`, `architecture`, `portrait`, `headshot`

## URL formats (what to return)
Aura thumbnails commonly look like:

```
https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/<UUID>_800w.jpg
```

### Higher-res (recommended)
Many images support a larger variant by swapping:
- `_800w` → `_1600w`

Example:
- 800w:  `.../<id>_800w.jpg`
- 1600w: `.../<id>_1600w.jpg`

If a `_1600w` variant 404s, keep `_800w` and instruct the user to open the asset page and download/export.

## Ratios (what to crop to)
- **Avatars**: 1:1 (square)
- **Headshots**: 4:5 or 3:4
- **Website heroes / large backgrounds**: 16:9
- **Mobile wallpapers / stories**: 9:16

Cropping tip:
- For faces, keep eyes ~1/3 from the top; avoid cutting chin/forehead.
- For backgrounds, preserve horizon lines and keep 30–50% negative space for text.

---

## Curated picks (5 each)

### 1) Backgrounds (5)
1. https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/fa51902b-c2a4-4c33-a96e-a8f1ef67edc6_3840w.jpg
2. https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/d14dc069-558a-4c51-8aad-5cc237f9b61d_3840w.jpg
3. https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/75134536-4198-40bf-9944-315511fe8c0b_3840w.jpg
4. https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/c31dd008-598b-4fc9-b5c7-9c3e1d296d38_3840w.jpg
5. https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/a4780cd9-2a3d-4bdc-9e5f-85a097b3a8bf_3840w.webp

Suggested exports:
- 16:9: 1920×1080, 2400×1350
- 9:16: 1080×1920

### 2) Abstract (5)
1. Abstract Gradient Hills in Neon Pastel Colors
   - https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/4734259a-bad7-422f-981e-ce01e79184f2_1600w.jpg
2. Abstract Blue Wave at Dusk
   - https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/e534354d-c5f2-4399-a1d9-2f50338e8c47_1600w.jpg
3. Abstract Blue Wave with Orange Highlights
   - https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/d14dc069-558a-4c51-8aad-5cc237f9b61d_1600w.jpg
4. Abstract neon light wave on black
   - https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/fa51902b-c2a4-4c33-a96e-a8f1ef67edc6_1600w.jpg
5. Blue credit card on vibrant gradient background
   - https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/bfef5098-c30f-4cd9-b4ac-04b2673ab943_1600w.jpg

Suggested exports:
- Desktop wallpaper: 2560×1600 or 2880×1800
- Mobile wallpaper: 1080×1920

### 3) Architecture (5)
1. Futuristic Deconstructed Pyramid in Grayscale
   - https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/724142aa-44a6-48d3-9cf3-761e00d05b78_1600w.jpg
2. Modern glass villa at dusk in lush landscape
   - https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/005600e5-f6ab-4e59-bc86-eaeb02797dfa_1600w.jpg
3. Ring-Shaped Futuristic City Against Starry Night
   - https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/5ee0a38a-b5d3-4531-8793-98beed4af162_1600w.jpg
4. Minimalist glass office overlooking misty fjord
   - https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/7f78131e-65e9-49b2-aa1f-ccc33e28df9f_1600w.webp
5. Isometric 3D Render of Modern Tiny House
   - https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/fb6415fd-bf4d-4ccf-8e9d-7ab445e99207_1600w.jpg

Suggested exports:
- Web hero: 2400×1350
- Feature section: 1600×900

### 4) Portraits (5)
1. https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/0d868fef-f560-45ca-ab35-5dad4fc29059_3840w.webp
2. https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/3186f9ea-5f5a-49f7-8fcf-568ad52f515e_3840w.webp
3. https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/65695f80-23f9-46ee-8487-cbb6c93cc48b_3840w.webp
4. https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/0d063fd9-f7c1-4536-ade0-9fd133f07279_3840w.webp
5. https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/582afef4-b810-47b8-a047-8b3597c323e1_3840w.webp

Suggested exports:
- 3:4: 1500×2000
- 4:5: 1200×1500

### 5) Headshots (5)
1. Black-and-white portrait of smiling man
   - https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/2f563338-39fa-47ea-9761-658d4f3f84db_1600w.jpg
2. Black-and-white studio portrait of a confident woman
   - https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/4f5668c5-fc4a-44e0-bc5e-a664189d3c31_1600w.jpg
3. Confident man in light blue shirt portrait
   - https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/eca707cc-a5b7-439a-b4fd-247f6106c2e1_1600w.jpg
4. Studio portrait of woman with striking blue eyes
   - https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/77415a2e-dcbc-4748-a29d-fced4821881a_1600w.jpg
5. Professional Portrait of Curly-Haired Businessman
   - https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/c92852bb-a510-405a-85ab-ffa0fde136a4_1600w.jpg

Suggested exports:
- 4:5: 800×1000, 1200×1500
- 1:1 variant: 512×512 (for avatar fallback)
