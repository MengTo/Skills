# Energy Diagnostics

## Contents

- Why Energy Matters
- Energy Impact Instrument
- Common Energy Drains and Fixes
- Thermal State Monitoring
- MetricKit Energy Metrics
- Xcode Energy Organizer
- Energy Optimization Checklist

## Why Energy Matters
- Battery drain is the #1 reason users delete apps
- Excessive energy use triggers **App Store review flags**
- iOS throttles apps with high energy impact in the background
- Thermal throttling degrades performance for all apps, not just yours

## Energy Impact Instrument

### Setup
1. **Xcode > Product > Profile** (Cmd+I)
2. Choose **Energy Log** template (iOS) or **Activity Monitor** template (macOS)
3. Record on **physical device** (energy profiling requires real hardware)
4. Reproduce typical usage patterns

### Reading the Energy Log
The Energy Impact gauge shows a composite score:

| Level | Score | Meaning |
|-------|-------|---------|
| Low | 0-3 | Good - minimal battery drain |
| Medium | 3-8 | Acceptable for active use, not idle |
| High | 8+ | Investigate - significant drain |
| Overhead | Red bar | System overhead from your app |

### Component Breakdown
| Component | What It Measures |
|-----------|-----------------|
| CPU | Processing time (biggest energy consumer) |
| GPU | Graphics rendering, Metal, animations |
| Network | Radio usage (cellular is most expensive) |
| Location | GPS, Wi-Fi, cell tower ranging |
| Display | Screen brightness influence (indirect) |
| Overhead | System services your app triggers |

## Common Energy Drains and Fixes

### Excessive Timer Usage

```swift
// Bad - timer fires every second even when app is idle
Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
    self.checkForUpdates() // Keeps CPU awake
}

// Good - use tolerance for coalescing, stop when not needed
let timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
    self.updateTimestamp()
}
timer.tolerance = 0.5 // System can defer +/-0.5s to coalesce with other work

// Better - use system notifications instead of polling
NotificationCenter.default.addObserver(
    forName: .significantTimeChange, // System fires this at midnight, timezone change
    object: nil, queue: .main
) { _ in self.updateDate() }
```

### Location Accuracy Over-specification

```swift
// Bad - GPS accuracy when you only need city-level
let manager = CLLocationManager()
manager.desiredAccuracy = kCLLocationAccuracyBest // GPS radio stays on
manager.startUpdatingLocation() // Continuous updates

// Good - match accuracy to need
// For weather/city features:
manager.desiredAccuracy = kCLLocationAccuracyKilometer
manager.requestLocation() // Single update, not continuous

// For navigation:
manager.desiredAccuracy = kCLLocationAccuracyBestForNavigation
manager.activityType = .automotiveNavigation // Optimizes for driving
manager.allowsBackgroundLocationUpdates = true
manager.pausesLocationUpdatesAutomatically = true // Pauses when stationary

// For "nearby" features:
manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
manager.distanceFilter = 100 // Only notify on 100m movement
```

### Network Request Inefficiency

```swift
// Bad - separate requests that could be batched
func refreshAll() async {
    let profile = try? await api.fetchProfile()
    let posts = try? await api.fetchPosts()
    let notifications = try? await api.fetchNotifications()
    let settings = try? await api.fetchSettings()
    // 4 separate radio activations
}

// Good - batch into single request or parallel group
func refreshAll() async {
    async let profile = api.fetchProfile()
    async let posts = api.fetchPosts()
    async let notifications = api.fetchNotifications()
    // 3 requests but radio stays active for one burst

    let results = await (profile, posts, notifications)
}

// Better - single batch endpoint
func refreshAll() async {
    let batch = try? await api.fetchDashboard()
    // 1 request with all data
}
```

### Cellular vs WiFi Awareness

```swift
import Network

let monitor = NWPathMonitor()

monitor.pathUpdateHandler = { path in
    if path.usesInterfaceType(.cellular) {
        // Reduce data usage
        self.imageQuality = .low
        self.prefetchEnabled = false
        self.analyticsFlushInterval = 300 // 5 min instead of 30s
    } else if path.usesInterfaceType(.wifi) {
        self.imageQuality = .high
        self.prefetchEnabled = true
        self.analyticsFlushInterval = 30
    }
}

monitor.start(queue: .main)
```

### Background Task Energy

```swift
// Bad - long-running background work without proper task
func applicationDidEnterBackground(_ application: UIApplication) {
    syncAllData() // May be killed, wastes energy if interrupted
}

// Good - use BGTaskScheduler for deferrable work
import BackgroundTasks

func scheduleSync() {
    let request = BGProcessingTaskRequest(identifier: "com.app.sync")
    request.requiresNetworkConnectivity = true
    request.requiresExternalPower = false // Set true for heavy work
    try? BGTaskScheduler.shared.submit(request)
}

func handleSync(task: BGProcessingTask) {
    let syncTask = Task {
        await performSync()
        task.setTaskCompleted(success: true)
    }

    task.expirationHandler = {
        syncTask.cancel()
        task.setTaskCompleted(success: false)
    }
}
```

### Animation Energy

```swift
// Bad - continuous animation running when not visible
struct PulsingView: View {
    @State private var isPulsing = false

    var body: some View {
        Circle()
            .scaleEffect(isPulsing ? 1.2 : 1.0)
            .animation(.easeInOut(duration: 1).repeatForever(), value: isPulsing)
            .onAppear { isPulsing = true }
    }
}

// Good - stop animation when not visible
struct PulsingView: View {
    @State private var isPulsing = false
    @Environment(\.scenePhase) var scenePhase

    var body: some View {
        Circle()
            .scaleEffect(isPulsing ? 1.2 : 1.0)
            .animation(
                isPulsing ? .easeInOut(duration: 1).repeatForever() : .default,
                value: isPulsing
            )
            .onChange(of: scenePhase) { _, phase in
                isPulsing = (phase == .active)
            }
    }
}
```

## Thermal State Monitoring

```swift
import Foundation

func monitorThermalState() {
    NotificationCenter.default.addObserver(
        forName: ProcessInfo.thermalStateDidChangeNotification,
        object: nil, queue: .main
    ) { _ in
        handleThermalState(ProcessInfo.processInfo.thermalState)
    }
}

func handleThermalState(_ state: ProcessInfo.ThermalState) {
    switch state {
    case .nominal:
        // Full performance
        enableAllFeatures()
    case .fair:
        // Slightly warm - reduce optional work
        disablePreloading()
    case .serious:
        // Hot - reduce significantly
        reduceAnimations()
        lowerImageQuality()
        pauseBackgroundSync()
    case .critical:
        // Thermal throttling imminent - minimize everything
        stopNonEssentialWork()
        showThermalWarningIfAppropriate()
    @unknown default:
        break
    }
}
```

## MetricKit Energy Metrics

Production energy data:

```swift
func didReceive(_ payloads: [MXMetricPayload]) {
    for payload in payloads {
        // CPU usage
        if let cpu = payload.cpuMetrics {
            log("Cumulative CPU time: \(cpu.cumulativeCPUTime)")
            log("CPU instructions: \(cpu.cumulativeCPUInstructions)")
        }

        // GPU usage
        if let gpu = payload.gpuMetrics {
            log("Cumulative GPU time: \(gpu.cumulativeGPUTime)")
        }

        // Cellular condition
        if let cellular = payload.cellularConditionMetrics {
            log("Cell condition time: \(cellular.histogrammedCellularConditionTime)")
        }

        // Network transfer
        if let network = payload.networkTransferMetrics {
            log("WiFi upload: \(network.cumulativeWifiUpload)")
            log("WiFi download: \(network.cumulativeWifiDownload)")
            log("Cellular upload: \(network.cumulativeCellularUpload)")
            log("Cellular download: \(network.cumulativeCellularDownload)")
        }

        // Location activity
        if let location = payload.locationActivityMetrics {
            log("Best accuracy time: \(location.cumulativeBestAccuracyTime)")
            log("10m accuracy time: \(location.cumulativeBestAccuracyForNavigationTime)")
        }
    }
}
```

## Xcode Energy Organizer

Access in **Xcode > Window > Organizer > Energy**:
- Shows energy reports from **real users** via TestFlight and App Store
- Breaks down by: CPU, Location, Display, Network, GPU, Accessories
- Filter by app version to track regressions
- Shows **background energy** separately - critical for battery complaints

## Energy Optimization Checklist

### CPU
- [ ] No polling timers without `tolerance` set
- [ ] Background work uses `BGTaskScheduler`, not continuous timers
- [ ] Heavy computation offloaded and cancellable
- [ ] Idle state truly idle - no periodic wake-ups without reason

### Network
- [ ] Requests batched when possible (single endpoint > multiple calls)
- [ ] Reduced data on cellular (lower image quality, less prefetch)
- [ ] No redundant requests (proper caching with `URLCache` / ETags)
- [ ] Background uploads use `URLSession` background configuration

### Location
- [ ] Accuracy matches actual need (`kCLLocationAccuracyKilometer` for weather)
- [ ] `requestLocation()` for one-shot needs, not `startUpdatingLocation()`
- [ ] `distanceFilter` set to avoid unnecessary updates
- [ ] `pausesLocationUpdatesAutomatically = true` when appropriate

### GPU / Animations
- [ ] Animations pause when app enters background
- [ ] No offscreen rendering (shadow, cornerRadius + clipsToBounds)
- [ ] Metal workloads respect thermal state
- [ ] Continuous animations stop when not visible

### Thermal
- [ ] App monitors `ProcessInfo.thermalState`
- [ ] Graceful degradation at `.serious` and `.critical` states
- [ ] Heavy features disabled proactively, not reactively
