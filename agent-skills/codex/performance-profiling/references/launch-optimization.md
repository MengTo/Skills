# Launch Time Optimization

## Contents

- App Launch Phases
- App Launch Instrument
- Pre-main Optimization
- Post-main Optimization
- Measuring Launch Time in Code
- MetricKit Launch Metrics
- Launch Optimization Checklist

## App Launch Phases

```
Cold Launch Timeline
--------------------------------------------------------
|  Pre-main                |  Post-main               |
|                          |                           |
|  DYLD        Runtime     |  App Init    First Frame  |
|  loading     init        |  UIKit/SwiftUI setup      |
|  ----------  ----------  |  ------------  ----------  |
|  dylibs      +load       |  AppDelegate   viewDidLoad|
|  rebasing    static      |  @main App     .body      |
|  binding     initializers|  scene setup   layout     |
|              ObjC setup  |  root view     render     |
--------------------------------------------------------
                                              ^
                                    First Frame Rendered
                                    (launch complete)
```

### Target Budgets
| Launch Type | Good | Acceptable | Poor |
|-------------|------|------------|------|
| Cold launch | < 400ms | < 1s | > 2s |
| Warm launch | < 200ms | < 500ms | > 1s |
| Resume | < 100ms | < 200ms | > 500ms |

**Cold launch**: App not in memory - full DYLD load, runtime init, UI setup.
**Warm launch**: App recently terminated but system cached some data.
**Resume**: App was suspended in background.

## App Launch Instrument

### Setup
1. **Xcode > Product > Profile** (Cmd+I)
2. Choose **App Launch** template
3. Record - the app launches and Instruments captures the entire timeline
4. Stop after app is fully interactive

### Reading the Results
- **Process Lifecycle** lane shows app state transitions
- **Thread State** lane shows main thread activity during launch
- **Time Profiler** lane shows CPU work during launch
- Focus on the region between process start and first frame

### Key Measurements
- **Time to first frame**: Total duration from process start to first CA commit
- **Pre-main time**: From process start to `main()` / `@main` entry
- **Post-main time**: From `main()` to first frame rendered

## Pre-main Optimization

### Reduce Dynamic Frameworks
Each dynamic framework adds ~10-30ms to launch:

```
Before: 15 dynamic frameworks -> ~300ms DYLD loading
After:  3 dynamic frameworks  -> ~50ms DYLD loading
```

**How to fix:**
- Convert dynamic frameworks to **static libraries** where possible
- Use Swift Package Manager (static by default) instead of dynamic frameworks
- Merge small frameworks into fewer larger ones
- Check with: `otool -L YourApp.app/YourApp` to list linked dylibs

### Remove Static Initializers
Static initializers (`+load`, `__attribute__((constructor))`) run before `main()`:

```swift
// Bad - runs before main(), delays launch
class LegacyManager: NSObject {
    override class func load() { // ObjC +load
        setup()
    }
}

// Bad - C-style constructor
@_cdecl("initEarly")
func initEarly() { /* runs before main */ }

// Good - defer to first use
class LegacyManager {
    static let shared = LegacyManager() // Lazy, created on first access
}
```

### Minimize ObjC Metadata
- Large ObjC class hierarchies increase rebasing/binding time
- Swift classes without `@objc` are more efficient
- Reduce ObjC category usage (each category adds metadata)

## Post-main Optimization

### Defer Non-Essential Initialization

```swift
@main
struct MyApp: App {
    init() {
        // Bad - all of this delays first frame
        AnalyticsManager.shared.configure()
        CrashReporter.shared.start()
        RemoteConfig.shared.fetch()
        ImageCache.shared.warmUp()
        DatabaseMigrator.run()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

// Good - only essential work at init, defer the rest
@main
struct MyApp: App {
    init() {
        // Only crash reporter is truly needed immediately
        CrashReporter.shared.start()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .task {
                    // Defer everything else to after first frame
                    await deferredSetup()
                }
        }
    }

    private func deferredSetup() async {
        AnalyticsManager.shared.configure()
        RemoteConfig.shared.fetch()
        ImageCache.shared.warmUp()
    }
}
```

### Lazy View Loading

```swift
// Bad - all tabs initialize their full view hierarchy at launch
TabView {
    HomeView()        // Heavy: fetches data, builds complex layout
    SearchView()      // Heavy: initializes search index
    ProfileView()     // Heavy: loads user data
}

// Good - use lazy containers, each tab builds only when selected
TabView {
    NavigationStack {
        HomeView()
    }
    .tabItem { Label("Home", systemImage: "house") }

    NavigationStack {
        SearchView()
    }
    .tabItem { Label("Search", systemImage: "magnifyingglass") }
}
// SwiftUI NavigationStack already lazy-loads destination views
// For custom containers, use LazyVStack instead of VStack
```

### Reduce Initial View Complexity

```swift
// Bad - loading everything at once
struct ContentView: View {
    @State private var allItems: [Item] = []

    var body: some View {
        List(allItems) { item in
            ComplexItemView(item: item)
        }
        .onAppear {
            allItems = try! ModelContext(container).fetch(
                FetchDescriptor<Item>(sortBy: [SortDescriptor(\.date)])
            )
        }
    }
}

// Good - show skeleton immediately, load data async
struct ContentView: View {
    @State private var items: [Item]?

    var body: some View {
        Group {
            if let items {
                List(items) { item in
                    ItemRow(item: item)
                }
            } else {
                SkeletonListView() // Lightweight placeholder
            }
        }
        .task {
            items = await loadItems()
        }
    }
}
```

### Database Migration at Launch

```swift
// Bad - blocking migration on main thread
let container = try ModelContainer(for: Item.self)
// If migration runs, this blocks until complete

// Good - show migration UI if needed
struct AppEntry: View {
    @State private var container: ModelContainer?
    @State private var isMigrating = false

    var body: some View {
        Group {
            if let container {
                ContentView()
                    .modelContainer(container)
            } else if isMigrating {
                MigrationProgressView()
            } else {
                ProgressView()
            }
        }
        .task {
            await setupContainer()
        }
    }

    private func setupContainer() async {
        // Check if migration needed
        if await needsMigration() {
            isMigrating = true
        }
        container = try? await Task.detached {
            try ModelContainer(for: Item.self)
        }.value
        isMigrating = false
    }
}
```

## Measuring Launch Time in Code

### Using os_signpost

```swift
import os

@main
struct MyApp: App {
    static let launchLog = OSLog(subsystem: Bundle.main.bundleIdentifier!, category: "Launch")
    static let launchSignpost = OSSignpostID(log: launchLog)

    init() {
        os_signpost(.begin, log: Self.launchLog, name: "AppLaunch", signpostID: Self.launchSignpost)
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .onAppear {
                    os_signpost(.end, log: Self.launchLog, name: "AppLaunch", signpostID: Self.launchSignpost)
                }
        }
    }
}
```

### Using CFAbsoluteTimeGetCurrent

```swift
// Quick and dirty launch measurement
@main
struct MyApp: App {
    static let launchStart = CFAbsoluteTimeGetCurrent()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .onAppear {
                    let elapsed = CFAbsoluteTimeGetCurrent() - Self.launchStart
                    print("Launch time: \(String(format: "%.3f", elapsed))s")
                }
        }
    }
}
```

## MetricKit Launch Metrics

Production launch time data from real users:

```swift
func didReceive(_ payloads: [MXMetricPayload]) {
    for payload in payloads {
        if let launch = payload.applicationLaunchMetrics {
            // Histogram of time-to-first-draw
            let histogram = launch.histogrammedTimeToFirstDraw
            for bucket in histogram.bucketEnumerator {
                guard let bucket = bucket as? MXHistogramBucket<UnitDuration> else { continue }
                print("[\(bucket.bucketStart) - \(bucket.bucketEnd)]: \(bucket.bucketCount) launches")
            }

            // Resume time histogram
            let resumeHistogram = launch.histogrammedResumeTime
            // Same enumeration pattern
        }
    }
}
```

## Launch Optimization Checklist

### Pre-main
- [ ] Minimize dynamic frameworks (prefer static linking)
- [ ] No `+load` methods or static initializers
- [ ] Remove unused frameworks from Link Binary With Libraries
- [ ] Strip unused architectures in release builds

### Post-main (App Init)
- [ ] Only essential setup in `App.init()` or `AppDelegate` (crash reporter only)
- [ ] Analytics, remote config, and prefetch deferred to `.task {}` after first frame
- [ ] No synchronous network calls at launch
- [ ] No blocking database migrations on main thread

### First Frame
- [ ] Initial view is lightweight (skeleton/placeholder)
- [ ] Data loading is async with `.task {}`
- [ ] Heavy views (maps, web views, complex lists) lazy-loaded
- [ ] Images use thumbnails, not full resolution

### Verification
- [ ] Measure with App Launch Instrument on oldest supported device
- [ ] Cold launch < 400ms on target device
- [ ] No regressions after changes (compare Instruments traces)
- [ ] MetricKit showing stable or improving launch times in production
