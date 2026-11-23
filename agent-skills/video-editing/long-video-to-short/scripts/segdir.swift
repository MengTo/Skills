// Person mattes for a folder of frames with macOS Vision (accurate). usage: segdir IN_DIR OUT_DIR
import Foundation
import Vision
import CoreImage
import AppKit
let a = CommandLine.arguments
let fm = FileManager.default
try? fm.createDirectory(atPath: a[2], withIntermediateDirectories: true)
let ctx = CIContext()
for name in try fm.contentsOfDirectory(atPath: a[1]).sorted() where name.hasSuffix(".png") || name.hasSuffix(".jpg") {
  let out = URL(fileURLWithPath: a[2]).appendingPathComponent((name as NSString).deletingPathExtension + ".png")
  if fm.fileExists(atPath: out.path) { continue }
  autoreleasepool {
    guard let ci = CIImage(contentsOf: URL(fileURLWithPath: a[1]).appendingPathComponent(name)) else { return }
    let req = VNGeneratePersonSegmentationRequest(); req.qualityLevel = .accurate; req.outputPixelFormat = kCVPixelFormatType_OneComponent8
    try? VNImageRequestHandler(ciImage: ci, options: [:]).perform([req])
    guard let pb = req.results?.first?.pixelBuffer else { return }
    var m = CIImage(cvPixelBuffer: pb)
    m = m.transformed(by: CGAffineTransform(scaleX: ci.extent.width / m.extent.width, y: ci.extent.height / m.extent.height))
    if let cg = ctx.createCGImage(m, from: ci.extent) { try? NSBitmapImageRep(cgImage: cg).representation(using: .png, properties: [:])!.write(to: out) }
  }
}
print("done")
