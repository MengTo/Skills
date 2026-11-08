// swift landmarks.swift <img>... → per image: d = eye-midpoint→mouth-centre distance (px); chin = lower-lip bottom→lowest jaw point / d; width = jaw width at mouth height / d
import Vision
import AppKit
func pts(_ r: VNFaceLandmarkRegion2D?, _ box: CGRect, _ W: Double, _ H: Double) -> [CGPoint] {
  guard let r = r else { return [] }
  return r.normalizedPoints.map { p in CGPoint(x: (box.minX + Double(p.x) * box.width) * W, y: (1 - (box.minY + Double(p.y) * box.height)) * H) }
}
for path in CommandLine.arguments.dropFirst() {
  guard let img = NSImage(contentsOfFile: path), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { print("\(path) none"); continue }
  let req = VNDetectFaceLandmarksRequest()
  try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
  guard let f = (req.results ?? []).max(by: { $0.boundingBox.width < $1.boundingBox.width }), let lm = f.landmarks else { print("\(path) noface"); continue }
  let W = Double(cg.width), H = Double(cg.height), b = f.boundingBox
  let le = pts(lm.leftEye, b, W, H), re = pts(lm.rightEye, b, W, H), lips = pts(lm.outerLips, b, W, H), jaw = pts(lm.faceContour, b, W, H)
  func c(_ a: [CGPoint]) -> CGPoint { CGPoint(x: a.map{$0.x}.reduce(0,+)/Double(a.count), y: a.map{$0.y}.reduce(0,+)/Double(a.count)) }
  guard !le.isEmpty, !re.isEmpty, !lips.isEmpty, !jaw.isEmpty else { print("\(path) partial"); continue }
  let em = CGPoint(x: (c(le).x + c(re).x)/2, y: (c(le).y + c(re).y)/2), mc = c(lips)
  let d = hypot(mc.x - em.x, mc.y - em.y)
  let lipBottom = lips.map{$0.y}.max()!, chinBottom = jaw.map{$0.y}.max()!
  let my = mc.y
  let near = jaw.filter { abs($0.y - my) < d * 0.25 }
  let width = near.isEmpty ? 0 : (near.map{$0.x}.max()! - near.map{$0.x}.min()!)
  print(String(format: "%@  d=%.0f  chin=%.3f d  jawW@mouth=%.2f d  yaw=%.2f", (path as NSString).lastPathComponent, d, (chinBottom - lipBottom)/d, width/d, f.yaw?.doubleValue ?? 0))
}
