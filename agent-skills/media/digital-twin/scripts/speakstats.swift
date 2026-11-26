// Per-frame speaking metrics from a video with Vision face landmarks.
// usage: speakstats VIDEO START_S DURATION_S FPS > out.csv
// Columns: t, cx, cy (face centre, in face widths from the first frame's centre), fw (face box width px),
// yawp (nose tip x offset from the eye midpoint / inter-ocular), roll (eye-line angle, deg),
// pitchp (eye line -> nose base / eye -> mouth: rises when the head tips down),
// open (inner-lip gap / mouth width), mw (mouth width / iod), eyeL, eyeR (eye height / width), brow (brow-eye gap / n)
import AVFoundation
import Vision
import AppKit

let a = CommandLine.arguments
let url = URL(fileURLWithPath: a[1])
let start = Double(a[2])!, dur = Double(a[3])!, fps = Double(a[4])!
let asset = AVURLAsset(url: url)
let gen = AVAssetImageGenerator(asset: asset)
gen.appliesPreferredTrackTransform = true
gen.maximumSize = CGSize(width: 1280, height: 1280)
gen.requestedTimeToleranceBefore = .zero
gen.requestedTimeToleranceAfter = .zero
print("t,cx,cy,fw,yawp,roll,pitchp,open,mw,eyeL,eyeR,brow")
var c0: CGPoint? = nil, w0: Double = 0
func ctr(_ p: [CGPoint]) -> CGPoint { CGPoint(x: p.map{$0.x}.reduce(0,+)/Double(p.count), y: p.map{$0.y}.reduce(0,+)/Double(p.count)) }
var t = start
while t < start + dur {
  defer { t += 1.0 / fps }
  guard let cg = try? gen.copyCGImage(at: CMTime(seconds: t, preferredTimescale: 600), actualTime: nil) else { continue }
  let W = Double(cg.width), H = Double(cg.height)
  let req = VNDetectFaceLandmarksRequest()
  try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
  guard let f = (req.results ?? []).max(by: { $0.boundingBox.width < $1.boundingBox.width }), let lm = f.landmarks else { print(String(format: "%.3f,,,,,,,,,,,", t)); continue }
  func pts(_ r: VNFaceLandmarkRegion2D?) -> [CGPoint] { (r?.pointsInImage(imageSize: CGSize(width: W, height: H)) ?? []).map { CGPoint(x: $0.x, y: H - $0.y) } }
  let le = pts(lm.leftEye), re = pts(lm.rightEye), ol = pts(lm.outerLips), il = pts(lm.innerLips), nose = pts(lm.nose), crest = pts(lm.noseCrest)
  let lb = pts(lm.leftEyebrow), rb = pts(lm.rightEyebrow)
  guard le.count > 2, re.count > 2, ol.count > 2, il.count > 2, nose.count > 2 else { print(String(format: "%.3f,,,,,,,,,,,", t)); continue }
  let lc = ctr(le), rc = ctr(re), em = CGPoint(x: (lc.x + rc.x) / 2, y: (lc.y + rc.y) / 2)
  let iod = hypot(rc.x - lc.x, rc.y - lc.y)
  let mc = ctr(ol)
  let d = hypot(mc.x - em.x, mc.y - em.y)
  let n = (nose.map { $0.y }.max()! - em.y)
  let tip = crest.last ?? ctr(nose)
  let mw = ol.map { $0.x }.max()! - ol.map { $0.x }.min()!
  let gap = il.map { $0.y }.max()! - il.map { $0.y }.min()!
  func eo(_ p: [CGPoint]) -> Double { (p.map{$0.y}.max()! - p.map{$0.y}.min()!) / max(1, p.map{$0.x}.max()! - p.map{$0.x}.min()!) }
  let browY = (lb + rb).map { $0.y }.reduce(0, +) / Double(max(1, (lb + rb).count))
  let box = f.boundingBox
  let fc = CGPoint(x: (box.midX) * W, y: (1 - box.midY) * H), fw = box.width * W
  if c0 == nil { c0 = fc; w0 = fw }
  let a2 = [lc, rc].sorted { $0.x < $1.x }
  let roll = atan2(a2[1].y - a2[0].y, a2[1].x - a2[0].x) * 180 / .pi
  print(String(format: "%.3f,%.4f,%.4f,%.1f,%.4f,%.2f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f", t, (fc.x - c0!.x) / w0, (fc.y - c0!.y) / w0, fw,
               (tip.x - em.x) / iod, roll, n / d, gap / max(1, mw), mw / iod, eo(le), eo(re), (em.y - browY) / max(1, n)))
}
