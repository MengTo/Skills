---
name: build-game-audio-feedback
description: Design or implement responsive audio feedback for a Three.js or web game. Use for action sounds, combat layers, music states, spatial audio, mix priorities, mute controls, accessibility, mobile audio unlock, and audio performance.
---

# Build Game Audio Feedback

Use audio to confirm player intent and combat state, not to add constant noise.

## Map feedback

Assign distinct cues for input accepted, windup, contact, block, miss, damage, interrupt, pickup, warning, death, and objective completion. Define priority so critical feedback remains audible during crowded encounters.

## Build for browsers

Unlock audio from a user gesture, respect mute/volume settings, release completed nodes, cap simultaneous voices, and provide subtitles or visual equivalents for meaningful cues. Change music by state with controlled transitions rather than restarts.

## Verify

Test first interaction, rapid actions, pause, tab/background return, mobile, muted state, and reduced motion/accessibility. Check memory and console health after a representative session.
