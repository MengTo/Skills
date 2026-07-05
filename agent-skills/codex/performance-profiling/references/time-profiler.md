# Time Profiler & Hang Detection

## Contents

- Instruments Setup
- Reading Time Profiler Results
- Hang Detection
- os_signpost API for Custom Profiling
- Thread Performance Checker
- Profiling Tips

## Instruments Setup

### Time Profiler Template
1. **Xcode > Product > Profile** (Cmd+I) - builds Release and opens Instruments
2. Choose **Time Profiler** template
3. Click record, reproduce the slow operation, stop recording

### Key Settings
- **Recording Mode**: Deferred (lower overhead, recommended for production-like profiling)
- **High Frequency**: 10ms sampling for fine-grained analysis (default is 1ms)
- **Record Waiting Threads**: Enable to see threads blocked on locks/IO

## Reading Time Profiler Results

### Call Tree Navigation
- **Weight**: Total time spent in function + all children
- **Self Weight**: Time in just that function (no children)
- **Symbol Name**: Function/method being sampled

### Essential Filters
| Filter | Purpose |
|--------|---------|
| Separate by Thread | Isolate main thread from background |
| Invert Call Tree | Show leaf functions first (where time is actually spent) |
| Hide System Libraries | Focus on your code |
| Flatten Recursion | Collapse recursive calls into one entry |

### Typical Workflow
1. **Separate by Thread** - find Main Thread
2. **Invert Call Tree** - heaviest leaf functions appear at top
3. **Hide System Libraries** - focus on your functions
4. Click disclosure triangle to trace back through the call chain
5. Double-click a function to jump to source code

## Hang Detection

### What Counts as a Hang
| Duration | Classification | User Perception |
|----------|---------------|-----------------|
| < 100ms | Acceptable | Smooth |
| 100-250ms | Micro-hang | Slight stutter |
| 250ms-1s | Hang | Noticeable delay |
| > 1s | Severe hang | App feels broken |
| > 3s | Watchdog kill risk | System may terminate |

### Using the Hangs Instrument
1. Open Instruments, choose **Time Profiler** (includes Hang detection lane)
2. Or use standalone **Animation Hitches** instrument for UI-specific stalls
3. Record and reproduce the interaction
4. Orange/red regions in the Hangs lane indicate hang duration
5. Click a hang to see the main thread call stack at that moment

### Common Hang Causes and Fixes

#### Synchronous File I/O on Main Thread

```swift
// Bad - blocks main thread
func loadData() -> Data {
    return try! Data(contentsOf: largeFileURL)
}

// Good - move to background
func loadData() async -> Data {
    return try! await Task.detached {
        try Data(contentsOf: largeFileURL)
    }.value
}
```

#### Synchronous Network Call

```swift
// Bad - URLSession.shared.dataTask is async but
// this pattern blocks main thread waiting for result
let data = try! Data(contentsOf: remoteURL)

// Good - use async/await
let (data, _) = try await URLSession.shared.data(from: remoteURL)
```

#### Heavy Computation on Main Thread

```swift
// Bad - sorting/filtering large arrays on main thread
func updateUI() {
    let sorted = hugeArray.sorted { $0.score > $1.score }
    tableView.reloadData()
}

// Good - offload computation
func updateUI() async {
    let sorted = await Task.detached {
        hugeArray.sorted { $0.score > $1.score }
    }.value
    tableView.reloadData()
}
```

#### Core Data / SwiftData Fetch on Main Thread

```swift
// Bad - fetching thousands of objects blocks UI
let items = try context.fetch(FetchDescriptor<Item>())

// Good - use background context (SwiftData)
let items = try await Task.detached {
    let context = ModelContext(container)
    return try context.fetch(FetchDescriptor<Item>())
}.value
```

#### Image Decoding on Main Thread

```swift
// Bad - decoding happens lazily on first display, blocking main thread
imageView.image = UIImage(contentsOfFile: path)

// Good - decode off main thread (iOS 15+)
let thumbnail = await UIImage(contentsOfFile: path)?
    .byPreparingThumbnail(ofSize: targetSize)
imageView.image = thumbnail

// Good - using preparingForDisplay
let decoded = await UIImage(contentsOfFile: path)?
    .byPreparingForDisplay()
```

## os_signpost API for Custom Profiling

Add signposts to measure specific operations in Instruments:

```swift
import os

extension OSSignpostID {
    static let dataLoad = OSSignpostID(log: .performance)
}

extension OSLog {
    static let performance = OSLog(
        subsystem: Bundle.main.bundleIdentifier!,
        category: "Performance"
    )
}

// Mark intervals
func loadData() async throws -> [Item] {
    let signpostID = OSSignpostID(log: .performance)
    os_signpost(.begin, log: .performance, name: "DataLoad", signpostID: signpostID)
    defer {
        os_signpost(.end, log: .performance, name: "DataLoad", signpostID: signpostID)
    }

    // ... actual work
    return items
}

// Mark events (single point)
os_signpost(.event, log: .performance, name: "CacheMiss")
```

### Viewing Signposts in Instruments
1. Add **os_signpost** instrument to your trace
2. Filter by subsystem/category to find your markers
3. Intervals show as bars with duration, events show as points

## Thread Performance Checker

Enable in **Scheme > Run > Diagnostics > Thread Performance Checker**.

Detects at runtime:
- **Priority inversions**: High-priority thread waiting on low-priority thread
- **Non-UI work on main thread**: Disk I/O, network calls detected on main
- **Excessive thread creation**: Spawning too many threads

Issues appear as purple runtime warnings in Xcode's Issue Navigator.

## Profiling Tips

### Profile What Matters
- Always profile on **physical device** - Simulator has different CPU/memory characteristics
- Use **Release** configuration - Debug builds disable compiler optimizations
- Profile with **realistic data** - 10 items vs 10,000 items reveals different bottlenecks
- **Warm the app first** - first run includes one-time setup that skews results

### Interpreting Results
- Focus on **Self Weight** to find actual bottlenecks (not just call tree weight)
- A function with high weight but low self-weight is just a caller - dig deeper
- Compare **before/after** traces to validate fixes
- Look for **repeated patterns** - a function called 1000x at 1ms each = 1s hang

### Quick Wins Checklist
- [ ] Move all file I/O off main thread
- [ ] Decode images asynchronously
- [ ] Use `@MainActor` sparingly - only for actual UI updates
- [ ] Batch database writes instead of single-row inserts
- [ ] Cache expensive computations (JSON parsing, date formatting)
- [ ] Use `DateFormatter` / `NumberFormatter` as shared instances (creation is expensive)
