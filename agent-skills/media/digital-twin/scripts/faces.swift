// swift faces.swift <in.jpg>... → prints "file x y w h conf yaw roll" (pixels, top-left origin) for the largest face
import Vision
import AppKit
for path in CommandLine.arguments.dropFirst() {
  guard let img = NSImage(contentsOfFile: path), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { print("\(path) none"); continue }
  let req = VNDetectFaceRectanglesRequest()
  let h = VNImageRequestHandler(cgImage: cg, options: [:])
  try? h.perform([req])
  let W = Double(cg.width), H = Double(cg.height)
  guard let f = (req.results ?? []).max(by: { $0.boundingBox.width < $1.boundingBox.width }) else { print("\(path) none"); continue }
  let b = f.boundingBox
  let yaw = f.yaw?.doubleValue ?? 0, roll = f.roll?.doubleValue ?? 0
  print(String(format: "%@ %.0f %.0f %.0f %.0f %.2f %.2f %.2f", path, b.minX * W, (1 - b.maxY) * H, b.width * W, b.height * H, f.confidence, yaw, roll))
}
