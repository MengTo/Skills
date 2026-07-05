# Common Pitfalls

Use this reference when the problem is not just invalidation or identity, but expensive or hard-to-diff work inside SwiftUI.

## `AnyView`

`AnyView` erases type information that SwiftUI uses for diffing. Avoid it in lists, grids, hot paths, and branch factories.

Prefer `@ViewBuilder`:

```swift
@ViewBuilder
func rowContent(for item: Item) -> some View {
    switch item.kind {
    case .text:
        TextItemView(item: item)
    case .image:
        ImageItemView(item: item)
    case .video:
        VideoItemView(item: item)
    }
}
```

Or create a dedicated view:

```swift
struct ItemContentView: View {
    let item: Item

    var body: some View {
        switch item.kind {
        case .text:
            TextItemView(item: item)
        case .image:
            ImageItemView(item: item)
        case .video:
            VideoItemView(item: item)
        }
    }
}
```

`AnyView` is acceptable for one-off bridging or non-hot paths, but it should be a conscious tradeoff.

## Object Creation in `body`

Do not create expensive reusable objects every time `body` runs.

| Object | Better approach |
| --- | --- |
| `DateFormatter`, `NumberFormatter` | `static let`, `.formatted(...)`, or injected formatter |
| `JSONDecoder`, `JSONEncoder` | Shared static or dependency |
| `NSRegularExpression`, `NSPredicate` | Static cache or Swift regex literal |
| View models/controllers | `@StateObject`, `@State`, or injection |
| Large `AttributedString` parsing | Precompute or cache |

```swift
struct DateLabel: View {
    let date: Date

    private static let formatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter
    }()

    var body: some View {
        Text(Self.formatter.string(from: date))
    }
}
```

## Expensive Computation in `body`

Filtering, sorting, decoding, layout measurement, and image preparation inside `body` block the main actor and repeat often.

Move computation to `onChange`, `.task(id:)`, a model, or cached state:

```swift
struct ItemListView: View {
    let items: [Item]
    @State private var query = ""
    @State private var filteredItems: [Item] = []

    var body: some View {
        VStack {
            TextField("Search", text: $query)
            List(filteredItems) { item in
                ItemRow(item: item)
            }
        }
        .task(id: query) {
            let source = items
            let currentQuery = query
            filteredItems = await Task.detached {
                source
                    .filter { $0.matches(currentQuery) }
                    .sorted { $0.date > $1.date }
            }.value
        }
    }
}
```

Keep actor isolation explicit if the model is not `Sendable`; avoid moving unsafe UI-bound objects into detached tasks.

## Image Work

Large image decoding in rows causes memory spikes and scroll jank.

- Use `AsyncImage` or a project image loader for remote images.
- Generate thumbnails off the main actor for local large images.
- Size images before display and use `.clipped()` where appropriate.
- Avoid decoding `UIImage(contentsOfFile:)` directly in a hot row body.

## Redundant State Updates

State writes trigger view invalidation. Guard writes when the displayed value did not change.

```swift
.onReceive(timer) { _ in
    let newSecond = Calendar.current.component(.second, from: Date())
    if newSecond != displayedSecond {
        displayedSecond = newSecond
    }
}
```

Do not mutate `@State` during `body`; it can create update loops.

Use `TimelineView` for time-driven UI when appropriate.

## Hidden Views Still Cost

`.opacity(0)` and `.hidden()` keep views in the tree. Use conditional inclusion when the view is expensive and does not need to preserve state:

```swift
if showInspector {
    InspectorView(model: model)
}
```

Use opacity when preserving state, layout, or animation continuity matters more than avoiding evaluation.

## Deep Modifier Chains

Long repeated modifier chains create large wrapper trees. Extract reusable modifier groups when they are common or hard to reason about:

```swift
struct CardStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(.background)
            )
    }
}

extension View {
    func cardStyle() -> some View {
        modifier(CardStyle())
    }
}
```

Do this for clarity and repeated combinations, not as a reflex for every few modifiers.

## Quick Diagnosis

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Whole screen updates on any model change | Broad `ObservableObject` | Use `@Observable`, focused stores, or subviews |
| Slow initial list load | Eager container or heavy row init | Use lazy container and remove row setup work |
| Scroll memory climbs | Full-size images or retained heavy rows | Use thumbnails, loader cache, `List` |
| Animation stutters | Computation in `body` | Cache or offload work |
| Type checker struggles | Huge `@ViewBuilder` switch | Extract branch views |
| Invisible expensive view still evaluates | `.hidden()` or `.opacity(0)` | Conditional inclusion if state preservation is not needed |
