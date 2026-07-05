# Lazy Loading

Use this reference when lists, grids, or scroll views are slow to appear, memory climbs while scrolling, or row views are created long before they become visible.

## Containers

`VStack`, `HStack`, and `ZStack` are eager. They create all children immediately.

`LazyVStack`, `LazyHStack`, `LazyVGrid`, `LazyHGrid`, and `List` create visible children on demand with a prefetch buffer.

| Container | Use for | Creates |
| --- | --- | --- |
| `VStack` / `HStack` | Small fixed groups, usually fewer than 50 simple items | All children |
| `LazyVStack` / `LazyHStack` | Many custom rows inside `ScrollView` | Visible children plus prefetch |
| `LazyVGrid` / `LazyHGrid` | Many grid cells | Visible cells plus prefetch |
| `List` | Large system-styled lists, editing, swipe actions, section behavior | Lazy rows with platform optimizations |

Rule of thumb: `ScrollView` alone is not lazy. A `ForEach` with many children inside `ScrollView` needs a lazy container or `List`.

```swift
ScrollView {
    LazyVStack(spacing: 8) {
        ForEach(items) { item in
            ItemRow(item: item)
        }
    }
}
```

## Choosing `List` vs Lazy Stack

Use `List` for very large lists, row reuse expectations, edit mode, swipe actions, and standard platform behavior.

Use `LazyVStack` in a `ScrollView` for highly custom layouts, pinned custom sections, mixed content, or when `List` styling fights the design.

For hundreds of image-heavy rows, prefer `List` or prove the lazy stack is acceptable with Instruments.

## Common Pitfalls

### `ScrollView` Without a Lazy Container

```swift
// Avoid for large collections
ScrollView {
    ForEach(items) { item in
        ItemRow(item: item)
    }
}
```

Wrap it:

```swift
ScrollView {
    LazyVStack {
        ForEach(items) { item in
            ItemRow(item: item)
        }
    }
}
```

### Infinite Child Sizes

Avoid children inside lazy containers that request infinite height. This can force broad measurement and defeat laziness.

```swift
ItemRow(item: item)
    .frame(height: 60)
```

Prefer fixed or intrinsic sizing over `.frame(maxHeight: .infinity)` for lazy rows.

### GeometryReader in Rows

`GeometryReader` proposes a large size and can cause layout churn inside lazy rows. Move it outside the lazy container when possible, pass the needed dimension down, or use `containerRelativeFrame` on newer platforms.

### Nested Scroll Views

Avoid same-axis nested scroll views. Model the content as one scroll view with sections or a single list. Same-axis nesting often causes gesture conflicts and confused layout.

## Grids

For large grids, favor simpler column definitions when possible:

| Column type | Performance note |
| --- | --- |
| `.fixed` | Cheapest layout calculation |
| `.flexible` | Moderate |
| `.adaptive` | Most calculation, useful but watch huge grids |

```swift
let columns = [GridItem(.adaptive(minimum: 150, maximum: 220))]

ScrollView {
    LazyVGrid(columns: columns, spacing: 16) {
        ForEach(items) { item in
            ItemCell(item: item)
        }
    }
}
```

## Pagination

Lazy stacks do not include UIKit-style prefetch callbacks. Use row appearance for simple pagination and guard duplicate loads.

```swift
ForEach(items) { item in
    ItemRow(item: item)
        .onAppear {
            if item.id == items.last?.id {
                loadMoreIfNeeded()
            }
        }
}
```

For production code, make `loadMoreIfNeeded()` idempotent and cancellation-aware.

## Confirm Laziness

Temporarily log row initialization:

```swift
struct ItemRow: View {
    let item: Item

    init(item: Item) {
        self.item = item
        print("ItemRow created: \(item.id)")
    }

    var body: some View {
        Text(item.title)
    }
}
```

If all rows print on first appearance, the container is eager or a child layout choice is forcing measurement. Remove the temporary log before final delivery.

## Fix Order

1. Replace eager stacks in scroll views with lazy stacks or `List`.
2. Ensure rows have stable ids.
3. Remove infinite sizing and same-axis nested scroll views.
4. Optimize row body work and images.
5. Profile with Instruments' View Body and Core Animation lanes when scroll jank remains.
