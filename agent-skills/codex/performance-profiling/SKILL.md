---
name: performance-profiling
description: Guide performance profiling for Apple platform apps with Instruments, Xcode diagnostics, and MetricKit. Use when investigating app hangs, stutters, high CPU, memory leaks, memory growth, OOM crashes, slow launch, battery drain, thermal issues, App Store performance readiness, or when adding os_signpost and measurement hooks.
---

# Performance Profiling

Use this skill to diagnose Apple app performance issues systematically, pick the right profiling workflow, apply targeted fixes, and verify the change with real measurements.

## Decision Tree

Choose the reference file before changing code:

```text
What performance problem are you investigating?

+ App hangs, stutters, dropped frames, slow UI, high CPU
  -> Read references/time-profiler.md

+ High memory, leaks, OOM crashes, growing footprint
  -> Read references/memory-profiling.md

+ Slow cold launch, warm launch, resume, or time to first frame
  -> Read references/launch-optimization.md

+ Battery drain, thermal throttling, background energy, network waste
  -> Read references/energy-diagnostics.md

+ General "app feels slow"
  -> Start with references/time-profiler.md, then references/memory-profiling.md

+ Pre-release performance audit
  -> Read all reference files and use the review checklist below
```

## Quick Reference

| Problem | Instrument / Tool | Key Metric | Reference |
| --- | --- | --- | --- |
| UI hangs over 250 ms | Time Profiler + Hangs | Hang duration, main thread stack | `references/time-profiler.md` |
| High CPU usage | Time Profiler | CPU percent by function, call tree weight | `references/time-profiler.md` |
| Memory leak | Leaks + Memory Graph | Leaked bytes, retain cycle paths | `references/memory-profiling.md` |
| Memory growth | Allocations | Live bytes, generation analysis | `references/memory-profiling.md` |
| Slow launch | App Launch | Time to first frame, pre-main, post-main | `references/launch-optimization.md` |
| Battery drain | Energy Log | Energy impact, CPU/GPU/network activity | `references/energy-diagnostics.md` |
| Thermal issues | Activity Monitor, Instruments | Thermal state transitions | `references/energy-diagnostics.md` |
| Network waste | Network profiler | Redundant fetches, payload size | `references/energy-diagnostics.md` |

## Workflow

1. Identify the performance category from the user report, traces, logs, or code path.
2. Read only the matching reference file unless the issue is broad or unclear.
3. Prefer real device profiling with a Release build and representative data.
4. Inspect the code path named by the profile before proposing a fix.
5. Apply the smallest targeted fix that addresses the measured bottleneck.
6. Re-profile or add a repeatable measurement to confirm the improvement.

## Profiling Ground Rules

- Profile on device when possible; Simulator uses host CPU and memory.
- Use Release configuration because optimizations can change hot paths.
- Reproduce with representative data, not empty databases or toy assets.
- Close unrelated apps to reduce noise during profiling.
- Keep measurements before and after the fix so the outcome is concrete.
- Add `os_signpost` markers when a workflow needs ongoing timing visibility.

## Xcode Diagnostics

Recommend relevant Scheme > Run > Diagnostics settings when they match the suspected issue:

| Setting | Use For |
| --- | --- |
| Main Thread Checker | UI work off the main thread |
| Thread Sanitizer | Data races and unsafe shared state |
| Address Sanitizer | Buffer overflows and use-after-free |
| Malloc Stack Logging | Allocation call stacks |
| Zombie Objects | Messages to deallocated objects |

## MetricKit Hook

Suggest MetricKit for production monitoring of launch, responsiveness, memory, and diagnostics:

```swift
import MetricKit

final class PerformanceReporter: NSObject, MXMetricManagerSubscriber {
    func startCollecting() {
        MXMetricManager.shared.add(self)
    }

    func didReceive(_ payloads: [MXMetricPayload]) {
        for payload in payloads {
            if let launch = payload.applicationLaunchMetrics {
                log("Resume time: \(launch.histogrammedResumeTime)")
            }
            if let responsiveness = payload.applicationResponsivenessMetrics {
                log("Hang time: \(responsiveness.histogrammedApplicationHangTime)")
            }
            if let memory = payload.memoryMetrics {
                log("Peak memory: \(memory.peakMemoryUsage)")
            }
        }
    }

    func didReceive(_ payloads: [MXDiagnosticPayload]) {
        for payload in payloads {
            if let hangs = payload.hangDiagnostics {
                for hang in hangs {
                    log("Hang: \(hang.callStackTree)")
                }
            }
        }
    }
}
```

## Review Checklist

Responsiveness:
- No synchronous work on the main thread over 100 ms.
- No file I/O or network calls on the main thread.
- Large Core Data or SwiftData fetches use background contexts.
- Images decode off the main thread.
- `@MainActor` is limited to code that truly needs UI access.

Memory:
- No retain cycles in delegates, closures, observers, or async tasks.
- Large resources are released when no longer visible.
- Collections and caches are bounded.
- `autoreleasepool` is used in tight loops that create Objective-C objects.

Launch:
- No heavy work in `init()` of the `@main App` struct.
- Non-essential initialization is deferred.
- Dynamic frameworks are minimized where practical.
- No synchronous network calls occur during launch.

Energy:
- Background tasks use the appropriate `BGTaskScheduler` request type.
- Location accuracy matches the product need.
- Timers use tolerance so the system can coalesce wakeups.
- Network requests are batched and cached where possible.

## References

- `references/time-profiler.md`: CPU profiling, hang detection, signpost API.
- `references/memory-profiling.md`: Allocations, Leaks, Memory Graph debugger.
- `references/launch-optimization.md`: Launch phases and cold/warm start optimization.
- `references/energy-diagnostics.md`: Battery, thermal state, and network efficiency.
