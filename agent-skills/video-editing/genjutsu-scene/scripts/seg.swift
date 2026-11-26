// Person matte with macOS Vision (accurate): his cut-out from the drive's first frame for the start-still composite.
// build: swiftc -O seg.swift -o seg     usage: seg in.jpg out.png
import Foundation
import Vision
import CoreImage
import AppKit
let a = CommandLine.arguments
let url = URL(fileURLWithPath: a[1])
guard let ci = CIImage(contentsOf: url) else { fatalError("no image") }
let req = VNGeneratePersonSegmentationRequest()
req.qualityLevel = .accurate
req.outputPixelFormat = kCVPixelFormatType_OneComponent8
let h = VNImageRequestHandler(ciImage: ci, options: [:])
try h.perform([req])
guard let pb = req.results?.first?.pixelBuffer else { fatalError("no mask") }
var m = CIImage(cvPixelBuffer: pb)
m = m.transformed(by: CGAffineTransform(scaleX: ci.extent.width / m.extent.width, y: ci.extent.height / m.extent.height))
let ctx = CIContext()
let cg = ctx.createCGImage(m, from: ci.extent)!
let rep = NSBitmapImageRep(cgImage: cg)
try rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: a[2]))
print("mask", Int(ci.extent.width), Int(ci.extent.height))
