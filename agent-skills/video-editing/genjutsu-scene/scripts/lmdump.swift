// A5: per-frame Vision dump (face landmarks + body pose) as JSON lines.
// usage: lmdump --video FILE FPS > out.jsonl      lmdump --images f1.jpg f2.jpg ... > out.jsonl
// Each line: {"i":index,"t":sec,"W":w,"H":h,"face":{bbox[x,y,w,h] px y-down, yaw,pitch,roll, pts:{region:[[x,y],...]}} | null,
//             "body":{joint:[x,y,conf]} | null}
import AVFoundation
import Vision
import AppKit

func dump(_ cg: CGImage, _ i: Int, _ t: Double) {
  let W = Double(cg.width), H = Double(cg.height)
  let fr = VNDetectFaceLandmarksRequest()
  fr.revision = VNDetectFaceLandmarksRequestRevision3
  let br = VNDetectHumanBodyPoseRequest()
  try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([fr, br])
  var out: [String: Any] = ["i": i, "t": t, "W": W, "H": H]
  if let f = (fr.results ?? []).max(by: { $0.boundingBox.width < $1.boundingBox.width }), let lm = f.landmarks {
    let bb = f.boundingBox
    var face: [String: Any] = ["bbox": [bb.minX * W, (1 - bb.maxY) * H, bb.width * W, bb.height * H],
                               "yaw": f.yaw?.doubleValue ?? 0, "pitch": f.pitch?.doubleValue ?? 0, "roll": f.roll?.doubleValue ?? 0]
    var pts: [String: Any] = [:]
    let regs: [(String, VNFaceLandmarkRegion2D?)] = [("leftEye", lm.leftEye), ("rightEye", lm.rightEye), ("leftPupil", lm.leftPupil),
      ("rightPupil", lm.rightPupil), ("outerLips", lm.outerLips), ("innerLips", lm.innerLips), ("faceContour", lm.faceContour),
      ("nose", lm.nose), ("leftBrow", lm.leftEyebrow), ("rightBrow", lm.rightEyebrow), ("medianLine", lm.medianLine)]
    for (n, r) in regs {
      if let r = r { pts[n] = r.pointsInImage(imageSize: CGSize(width: W, height: H)).map { [Double($0.x), H - Double($0.y)] } }
    }
    face["pts"] = pts
    out["face"] = face
  } else { out["face"] = NSNull() }
  if let b = (br.results ?? []).first, let ps = try? b.recognizedPoints(.all) {
    var body: [String: Any] = [:]
    for (k, p) in ps where p.confidence > 0.1 { body[k.rawValue.rawValue] = [Double(p.location.x) * W, (1 - Double(p.location.y)) * H, Double(p.confidence)] }
    out["body"] = body
  } else { out["body"] = NSNull() }
  let d = try! JSONSerialization.data(withJSONObject: out)
  FileHandle.standardOutput.write(d); FileHandle.standardOutput.write("\n".data(using: .utf8)!)
}

let a = CommandLine.arguments
if a[1] == "--images" {
  for (i, p) in a.dropFirst(2).enumerated() {
    autoreleasepool {
      let img = NSImage(contentsOfFile: p)!
      var r = CGRect(origin: .zero, size: img.size)
      dump(img.cgImage(forProposedRect: &r, context: nil, hints: nil)!, i, 0)
    }
  }
} else {
  let fps = Double(a[3])!
  let asset = AVURLAsset(url: URL(fileURLWithPath: a[2]))
  let dur = CMTimeGetSeconds(asset.duration)
  let gen = AVAssetImageGenerator(asset: asset)
  gen.appliesPreferredTrackTransform = true
  gen.requestedTimeToleranceBefore = .zero; gen.requestedTimeToleranceAfter = .zero
  var i = 0
  while Double(i) / fps < dur - 0.5 / fps {
    let t = Double(i) / fps
    autoreleasepool {
      if let cg = try? gen.copyCGImage(at: CMTime(seconds: t + 0.001, preferredTimescale: 600), actualTime: nil) { dump(cg, i, t) }
    }
    i += 1
  }
}
