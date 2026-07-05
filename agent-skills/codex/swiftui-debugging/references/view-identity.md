# View Identity

Use this reference when SwiftUI loses state, repeats `onAppear`, restarts tasks, animates as insert/remove instead of update, drops focus, resets scroll position, or `_printChanges()` reports `@identity changed`.

## Identity Rules

SwiftUI preserves state when identity and type are stable. It recreates a view when identity changes or when a branch yields a different structural position/type.

| Comparison | SwiftUI behavior |
| --- | --- |
| Same identity, same type | Update in place and preserve `@State` |
| Same identity, different type | Destroy old view and create new view |
| Different identity | Destroy old view and create new view |

## Structural Identity

Structural identity comes from position in the view tree. Two views in different positions are different views even when they have the same text or model.

Avoid `if`/`else` when both branches render the same conceptual view with different modifiers:

```swift
// Prefer this
Text(item.title)
    .foregroundStyle(isHighlighted ? .yellow : .primary)
    .bold(isHighlighted)
```

Use branching when the content is truly different and recreation is acceptable, such as loading versus loaded states.

## Explicit Identity

Use `.id()` or `ForEach` identifiers only with stable, unique values from the model.

```swift
ForEach(items, id: \.id) { item in
    ItemRow(item: item)
}

DetailView(item: selectedItem)
    .id(selectedItem.id)
```

Never use values that change every render:

```swift
DetailView(item: item)
    .id(UUID()) // Forces full recreation every body call
```

Avoid array offsets for mutable arrays. Insertions and deletions shift offsets, so SwiftUI can preserve the wrong row state for the wrong data.

## `ForEach` Checklist

- Use `Identifiable` models when possible.
- Ensure ids are unique across the collection.
- Avoid `\.self` for non-unique values such as duplicated strings.
- Avoid indices for editable, sortable, or filterable collections.
- Keep ids stable across refreshes and pagination.

## Symptoms and Causes

| Symptom | Likely cause |
| --- | --- |
| `@State` resets | Identity changed |
| `onAppear` fires repeatedly | Unstable `.id()` or lazy cell lifecycle |
| Task cancels and restarts | View recreated |
| Text field loses focus | Text field identity changed |
| List scroll position resets | Row ids or parent identity changed |
| Animation inserts/removes instead of morphing | Conditional structure changed |

## Debugging

Add `_printChanges()` and watch for `@identity changed`.

```swift
var body: some View {
    let _ = Self._printChanges()
    Text("Content")
}
```

Add temporary appear/disappear logs around the suspicious subtree:

```swift
DetailView(item: item)
    .onAppear { logger.debug("Detail appeared \(item.id)") }
    .onDisappear { logger.debug("Detail disappeared \(item.id)") }
```

If the same logical item appears and disappears repeatedly without navigation, identity is unstable.

## Fix Patterns

| Problem | Fix |
| --- | --- |
| `.id(UUID())`, `.id(Date())`, random ids | Use a stable model id |
| `ForEach(Array(items.enumerated()), id: \.offset)` | Use model identity |
| Duplicate ids | Add a true unique id to the model |
| Branching only to change modifiers | Use ternary modifier values |
| `AnyView` around dynamic branches | Use `@ViewBuilder` or a dedicated enum-backed view |
| State should reset when selected item changes | Add `.id(selectedItem.id)` at the correct boundary |

## Intentional Recreation

Sometimes `.id()` is the right tool: use it when stale local state must reset for a new item, a new document, or a new navigation context. Place the `.id()` at the smallest boundary that should reset, not at a high parent that would rebuild unrelated UI.
