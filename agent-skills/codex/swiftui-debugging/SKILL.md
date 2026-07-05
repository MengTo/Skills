---
name: swiftui-debugging
description: Diagnose and fix SwiftUI rendering performance issues, including unnecessary body re-evaluations, slow or janky views, scrolling/list/grid stutters, view identity bugs, lost state, excessive `Self._printChanges()` output, `@Observable` versus `ObservableObject` observation scope, `AnyView` performance concerns, and expensive work inside SwiftUI `body`.
---

# SwiftUI Debugging

Use this skill to turn SwiftUI performance complaints into a small evidence loop: identify what changed, confirm whether SwiftUI is recreating or merely re-evaluating views, then apply the narrowest fix.

## Workflow

1. Reproduce or localize the symptom.
   - Search for the named view, model, list/grid, or modifier chain before editing.
   - Ask for a minimal reproduction only when the target view or interaction cannot be inferred from the repo.
   - Prefer a profiler trace, `_printChanges()` output, Console logs, or a clear interaction path over guesswork.

2. Choose the diagnostic path.
   - Unexpected body calls or noisy `_printChanges()`: read `references/body-reevaluation.md`.
   - State resets, repeated `onAppear`, weird animations, focus loss, or scroll resets: read `references/view-identity.md`.
   - Slow lists, grids, scroll views, or initial load with many items: read `references/lazy-loading.md`.
   - `AnyView`, object creation in `body`, expensive sorting/filtering, oversized images, or repeated state writes: read `references/common-pitfalls.md`.

3. Instrument lightly before broad rewrites.
   - Use `let _ = Self._printChanges()` in the smallest suspicious view.
   - Use Instruments' SwiftUI template when a code inspection cannot explain the cost.
   - Use `os.Logger` or `os_signpost` for custom counts around expensive paths.

4. Fix by reducing invalidation, preserving identity, or moving work.
   - Move state down to the view that actually uses it.
   - Split large views so unrelated state changes do not re-evaluate expensive subtrees.
   - Use stable identifiers for `ForEach` and `.id()`.
   - Replace eager containers with `List` or lazy stacks/grids for large collections.
   - Move heavy formatting, decoding, sorting, filtering, and image preparation out of `body`.

5. Verify the symptom, then clean up temporary instrumentation unless the user wants it left in place.

## Quick Triage

| Symptom | First suspect | Reference |
| --- | --- | --- |
| `body` runs when unrelated values change | Over-observation, parent recreation, state too high | `body-reevaluation.md` |
| `_printChanges()` shows `@identity changed` | Unstable `.id()`, conditional structure change | `view-identity.md` |
| Scroll view creates hundreds of rows at once | `VStack`/`HStack` inside `ScrollView`, no lazy container | `lazy-loading.md` |
| `onAppear` repeats for same content | Identity churn or lazy-cell recycling | `view-identity.md`, `lazy-loading.md` |
| Typing in a field updates the whole screen | Broad `ObservableObject`, state stored too high | `body-reevaluation.md` |
| Initial load or animation stutters | Expensive work in `body`, image decode, eager layout | `common-pitfalls.md` |
| Diffing seems poor around dynamic view types | `AnyView` or erased branching | `common-pitfalls.md` |

## Useful Tools

### `Self._printChanges()`

```swift
var body: some View {
    let _ = Self._printChanges()
    // view content
}
```

Interpret common output as:

| Output | Meaning |
| --- | --- |
| `@self changed` | The parent recreated this view value. Check parent invalidation and input equality. |
| `@identity changed` | SwiftUI destroyed and recreated the view. Check `.id()`, `ForEach` ids, and branching. |
| `_property changed` | A stored property, state, binding, or environment value changed. |

### Instruments

Use Xcode's SwiftUI template to inspect View Body counts, View Properties changes, and Core Animation commits. Sort by count or duration, reproduce the slow interaction, and focus edits on the hottest view types.

### Custom Logging

Use `os.Logger` for quick local counts or `os_signpost` when you need timeline correlation in Instruments.

## Review Checklist

- No unstable `.id()` values such as `UUID()`, `Date()`, random values, or mutable array indices.
- `ForEach` uses stable, unique model identifiers.
- Conditional branches are not used solely to toggle modifiers on the same view.
- Large collections use `List`, `LazyVStack`, `LazyHStack`, `LazyVGrid`, or `LazyHGrid`.
- Views observe only the model properties they actually display or mutate.
- `@Observable` is preferred over broad `ObservableObject` when the deployment target allows it.
- Formatters, decoders, predicates, regexes, view models, and image decoding are not created inside `body`.
- Expensive filtering, sorting, and layout calculations run on change, in cached state, or off the main actor when appropriate.
- Temporary `_printChanges()`, print logs, and signposts are removed or clearly intentional before final delivery.

## API Availability

| API / technique | Minimum platform |
| --- | --- |
| `Self._printChanges()` | iOS 15 / macOS 12 era SwiftUI diagnostics |
| `ObservableObject` | iOS 13 / macOS 10.15 |
| `@Observable` | iOS 17 / macOS 14 |
| `LazyVStack`, `LazyHStack`, `LazyVGrid`, `LazyHGrid` | iOS 14 / macOS 11 |
| `.id()` | iOS 13 / macOS 10.15 |
| `TimelineView` | iOS 15 / macOS 12 |
| Instruments SwiftUI template | Xcode 14+ |

## References

- `references/body-reevaluation.md`: dependency invalidation, `_printChanges()`, observation scope, and state placement.
- `references/view-identity.md`: structural identity, `.id()`, `ForEach`, branch identity, and state loss.
- `references/lazy-loading.md`: eager versus lazy containers, list/grid choices, scroll performance, and lazy pitfalls.
- `references/common-pitfalls.md`: `AnyView`, object allocation, expensive body work, image decoding, redundant state, and hidden views.
- `references/upstream-license.md`: upstream attribution and MIT license notice for the source material.
