// Meng's Kimi twin in the camera (18 Nov, prompts 199: "Use my Kimi twin", then "only put cameras at key
// places 25% of the video"). HeyGen Avatar 6 on his trained Kimi look,
// 1080p 25 fps, one render ($7.30) of the voice's eight key stretches joined with 0.4 s of silence, so his
// mouth is on voice-d3's own words (sync measured 0 ms on every stretch) and no word time moves.
// Render: kimi-keys.mp4 in the film's cache folder (map: audio/kimi-keys-map.json).
// Frames in meng/kimi/ are not in git: ffmpeg -i kimi-keys.mp4 -q:v 3 meng/kimi/%04d.jpg (1840), then the
// silent last 0.9 s played back and forth to 1877 so the end card holds a live face to the film's end.
// [film from, film to, seconds into the render at `from`]. fx/fy/fs: his face in its frames, measured with
// Vision on the render (eyes at 0.532, 0.382; 22 % larger in frame than still 166).
// His frames exactly as HeyGen made them: no grade, relight or sharpening (Meng, 19 Nov, prompt 212: "can you
// not touch my video? ... I don't want you to touch the lighting at all"). A warm grade tried in round 10
// (blind judges +0.5) darkened his face and was taken off.
(function () {
  const K = { dir: 'meng/kimi/', n: 1877, fps: 25, fx: 0.549, fy: 0.427, fs: 1.217 };
  const S = [
    [18.82, 49.62, 0], [65.13, 68.13, 31.2], [89.03, 91.75, 34.6], [120.03, 124.38, 37.72],
    [153.04, 155.78, 42.47], [177.38, 183.09, 45.61], [224.82, 226.83, 51.72], [249.72, 271, 54.13],
  ];
  window.TWIN = S.map(([from, to, off]) => ({ ...K, from, to, off }));
})();
