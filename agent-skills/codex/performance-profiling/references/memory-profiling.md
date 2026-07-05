# Memory Profiling

## Contents

- Instruments Setup
- Allocations Instrument
- Leaks Instrument
- Xcode Memory Graph Debugger
- Autorelease Pool Optimization
- Memory Footprint Tracking in Code
- Quick Diagnosis Checklist

## Instruments Setup

### Allocations Instrument
1. **Xcode > Product > Profile** (Cmd+I)
2. Choose **Allocations** template
3. Record, reproduce the issue, stop

### Leaks Instrument
- Included in the Allocations template by default
- Runs periodic scans for unreachable memory
- Red crosses in the Leaks lane indicate detected leaks

## Allocations Instrument

### Key Metrics
| Metric | Meaning |
|--------|---------|
| All Heap Allocations | Total memory allocated on the heap |
| Live Bytes | Currently allocated (not freed) memory |
| Transient Bytes | Allocated and freed during recording |
| # Living | Count of live allocation objects |
| # Transient | Count of freed allocations |

### Reading the Results
- Sort by **Live Bytes** to find largest memory consumers
- Sort by **# Living** to find most numerous allocations
- Click a category to see individual allocations with stack traces
- **Persistent** column shows objects that survive across generations

### Generation Analysis (Mark Generation)
Track memory growth over repeated operations:

1. Start recording
2. Click **Mark Generation** to baseline
3. Perform an operation (open screen, load data, etc.)
4. Click **Mark Generation** again
5. Repeat the same operation
6. Compare generations - growth between identical operations = leak or unbounded cache

**What to look for:**
- Stable: Each generation has similar Live Bytes
- Leaking: Each generation grows - objects from previous generations persist
- Caching: Growth that plateaus after a few generations (may be intentional)

### Common Memory Issues

#### Unbounded Cache Growth

```swift
// Bad - cache grows forever
class ImageCache {
    var cache: [URL: UIImage] = [:]

    func image(for url: URL) -> UIImage? {
        return cache[url]
    }
}

// Good - use NSCache for automatic eviction
class ImageCache {
    private let cache = NSCache<NSURL, UIImage>()

    init() {
        cache.countLimit = 100
        cache.totalCostLimit = 50 * 1024 * 1024 // 50 MB
    }

    func image(for url: URL) -> UIImage? {
        return cache.object(forKey: url as NSURL)
    }

    func store(_ image: UIImage, for url: URL) {
        let cost = image.cgImage.map { $0.bytesPerRow * $0.height } ?? 0
        cache.setObject(image, forKey: url as NSURL, cost: cost)
    }
}
```

#### Large Images Not Downsampled

```swift
// Bad - full resolution image loaded into memory
let image = UIImage(contentsOfFile: photoPath)
// 4032x3024 photo = ~48 MB in memory

// Good - downsample to display size
func downsample(imageAt url: URL, to pointSize: CGSize, scale: CGFloat) -> UIImage? {
    let maxDimensionInPixels = max(pointSize.width, pointSize.height) * scale
    let options: [CFString: Any] = [
        kCGImageSourceCreateThumbnailFromImageAlways: true,
        kCGImageSourceShouldCacheImmediately: true,
        kCGImageSourceCreateThumbnailWithTransform: true,
        kCGImageSourceThumbnailMaxPixelSize: maxDimensionInPixels
    ]

    guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
          let cgImage = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary)
    else { return nil }

    return UIImage(cgImage: cgImage)
}
```

## Leaks Instrument

### How Leaks Detection Works
- Scans heap at intervals for objects with no root references
- Detects **unreachable** memory - allocated but no path from stack/globals
- Does NOT detect **logical leaks** (reachable but never used, like unbounded caches)

### Common Retain Cycle Patterns

#### Closure Capturing Self

```swift
// Bad - retain cycle: self -> timer -> closure -> self
class ViewModel {
    var timer: Timer?

    func startPolling() {
        timer = Timer.scheduledTimer(withTimeInterval: 5, repeats: true) { _ in
            self.refresh() // Strong capture of self
        }
    }
}

// Good - weak capture
timer = Timer.scheduledTimer(withTimeInterval: 5, repeats: true) { [weak self] _ in
    self?.refresh()
}
```

#### Delegate Retain Cycle

```swift
// Bad - strong delegate creates cycle
protocol ServiceDelegate: AnyObject {
    func didComplete()
}

class Service {
    var delegate: ServiceDelegate? // Strong reference
}

class ViewModel: ServiceDelegate {
    let service = Service() // ViewModel -> Service -> ViewModel
    init() { service.delegate = self }
}

// Good - weak delegate
class Service {
    weak var delegate: ServiceDelegate?
}
```

#### Closure in Collection

```swift
// Bad - closures in array capture self strongly
class Coordinator {
    var handlers: [() -> Void] = []

    func register() {
        handlers.append {
            self.handleEvent() // Each closure retains self
        }
    }
}

// Good - weak capture in each closure
handlers.append { [weak self] in
    self?.handleEvent()
}
```

#### NotificationCenter (Pre-iOS 9 / Manual)

```swift
// Modern iOS/macOS: system auto-removes observers on dealloc
// But if using block-based API, the token retains the closure:

// Bad - token keeps closure alive
let token = NotificationCenter.default.addObserver(
    forName: .dataChanged, object: nil, queue: .main
) { _ in
    self.reload() // Retained by token
}

// Good - store and remove, or use weak self
let token = NotificationCenter.default.addObserver(
    forName: .dataChanged, object: nil, queue: .main
) { [weak self] _ in
    self?.reload()
}
```

## Xcode Memory Graph Debugger

### When to Use
- Leaks instrument shows leaks but you need to see **why** objects are retained
- You suspect retain cycles but can't find them in code review
- You need to see the **full ownership graph** of an object

### How to Use
1. Run app in **Debug** mode (not Profile)
2. Reproduce the state where objects should be deallocated
3. Click the **Memory Graph** button in Xcode's debug bar (looks like interconnected nodes)
4. Xcode pauses and captures the heap

### Reading the Graph
- **Left sidebar**: List of all live objects grouped by type
- **Purple exclamation marks**: Xcode-detected leaks / retain cycles
- **Center canvas**: Visual graph of object references
- Click an object to see its retain graph - who holds a strong reference to it

### Debugging Tips
- Filter by your module name to ignore system objects
- Look for **cycles** - two objects pointing at each other
- Check **backtrace** in the right sidebar to see where the object was allocated
- Export the graph: **File > Export Memory Graph** for sharing

### Enable Malloc Stack Logging
For full allocation backtraces in Memory Graph Debugger:
1. **Scheme > Run > Diagnostics**
2. Enable **Malloc Stack Logging** (Live Allocations Only)
3. Now the right sidebar shows the exact call stack that allocated each object

## Autorelease Pool Optimization

In tight loops creating Objective-C bridged objects:

```swift
// Bad - autoreleased objects accumulate until loop ends
for item in largeDataSet {
    let string = item.name as NSString       // Autoreleased
    let data = string.data(using: .utf8)     // Autoreleased
    process(data)
}
// Memory spikes until loop completes and pool drains

// Good - drain pool each iteration
for item in largeDataSet {
    autoreleasepool {
        let string = item.name as NSString
        let data = string.data(using: .utf8)
        process(data)
    }
}
// Memory stays flat - pool drains each iteration
```

### When autoreleasepool Matters
- Processing large collections (1000+ items)
- Creating temporary `NSString`, `NSData`, `NSNumber` objects in loops
- Image processing pipelines
- **Not needed** for pure Swift value types (String, Data, Array)

## Memory Footprint Tracking in Code

```swift
import os

func logMemoryFootprint() {
    var info = mach_task_basic_info()
    var count = mach_msg_type_number_t(
        MemoryLayout<mach_task_basic_info>.size / MemoryLayout<natural_t>.size
    )
    let result = withUnsafeMutablePointer(to: &info) {
        $0.withMemoryRebound(to: integer_t.self, capacity: Int(count)) {
            task_info(mach_task_self_, task_flavor_t(MACH_TASK_BASIC_INFO), $0, &count)
        }
    }
    if result == KERN_SUCCESS {
        let usedMB = Double(info.resident_size) / 1_048_576
        os_log("Memory footprint: %.1f MB", usedMB)
    }
}
```

## Quick Diagnosis Checklist
- [ ] Run Allocations with Generation Analysis - does memory grow across identical operations?
- [ ] Run Leaks instrument - any detected leaks?
- [ ] Check Memory Graph Debugger for retain cycles (purple warnings)
- [ ] Search for `self` in closures without `[weak self]` or `[unowned self]`
- [ ] Verify delegates are declared `weak`
- [ ] Check `NSCache` usage instead of plain dictionaries for caches
- [ ] Verify images are downsampled to display size
- [ ] Use `autoreleasepool` in tight loops with ObjC-bridged objects
