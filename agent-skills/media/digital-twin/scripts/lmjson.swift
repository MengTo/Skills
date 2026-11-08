import Foundation
import Vision
import AppKit

// usage: swift lmjson.swift out.json img1 img2 ...   (landmarks per image → JSON for measure.py and fix_still.py)
let args = CommandLine.arguments
let outPath = args[1]
var result: [String: Any] = [:]
for path in args.dropFirst(2) {
    guard let img = NSImage(contentsOfFile: path),
          let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
    let w = CGFloat(cg.width), h = CGFloat(cg.height)
    let req = VNDetectFaceLandmarksRequest()
    req.revision = VNDetectFaceLandmarksRequestRevision3
    let handler = VNImageRequestHandler(cgImage: cg, options: [:])
    try? handler.perform([req])
    guard let faces = req.results, let face = faces.max(by: { $0.boundingBox.width < $1.boundingBox.width }),
          let lm = face.landmarks else { continue }
    func pts(_ r: VNFaceLandmarkRegion2D?) -> [[Double]] {
        guard let r = r else { return [] }
        return r.pointsInImage(imageSize: CGSize(width: w, height: h)).map { [Double($0.x), Double(h - $0.y)] }
    }
    let bb = face.boundingBox
    result[(path as NSString).lastPathComponent] = [
        "size": [Double(w), Double(h)],
        "bbox": [Double(bb.minX * w), Double((1 - bb.maxY) * h), Double(bb.width * w), Double(bb.height * h)],
        "yaw": face.yaw?.doubleValue ?? 0,
        "roll": face.roll?.doubleValue ?? 0,
        "pitch": face.pitch?.doubleValue ?? 0,
        "leftEye": pts(lm.leftEye), "rightEye": pts(lm.rightEye),
        "leftPupil": pts(lm.leftPupil), "rightPupil": pts(lm.rightPupil),
        "leftBrow": pts(lm.leftEyebrow), "rightBrow": pts(lm.rightEyebrow),
        "nose": pts(lm.nose), "noseCrest": pts(lm.noseCrest), "medianLine": pts(lm.medianLine),
        "outerLips": pts(lm.outerLips), "innerLips": pts(lm.innerLips),
        "faceContour": pts(lm.faceContour),
    ]
}
let data = try! JSONSerialization.data(withJSONObject: result, options: [.prettyPrinted, .sortedKeys])
try! data.write(to: URL(fileURLWithPath: outPath))
print("wrote \(result.count) faces")
