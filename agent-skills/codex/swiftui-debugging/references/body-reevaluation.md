# Body Re-evaluation

Use this reference when a view's `body` runs too often, `_printChanges()` is noisy, or unrelated model changes appear to invalidate a SwiftUI subtree.

## What Triggers `body`

SwiftUI calls `body` when a dependency read by the view changes. A `body` call is not the same as a screen redraw; SwiftUI still diffs the result. The call itself can be expensive when the view builds a large tree or performs work.

| Dependency | Triggers when |
| --- | --- |
| `@State` | The wrapped value changes |
| `@Binding` | The source value changes |
| `@Environment` | A read environment value changes |
| `@Observable` | A property read by `body` changes |
| `ObservableObject` | `objectWillChange` fires, usually for any `@Published` property |
| Parent input | The parent passes a different value or recreates the child |

## `Self._printChanges()`

Add this as the first statement inside the smallest suspicious view:

```swift
var body: some View {
    let _ = Self._printChanges()
    // view content
}
```

Read the output as:

| Output | Meaning | Likely fix |
| --- | --- | --- |
| `_item changed` | A stored input changed | Check value equality and parent data flow |
| `_isEditing changed` | Local state changed | Move or narrow the state if unrelated UI updates |
| `_colorScheme changed` | Environment dependency changed | Remove unused environment reads |
| `@self changed` | Parent recreated the view value | Split parent, pass equatable values, move state down |
| `@identity changed` | SwiftUI destroyed and recreated the view | Inspect `.id()`, `ForEach`, and conditional branches |

## Observation Scope

Prefer `@Observable` when deployment targets allow it. It tracks property reads made during `body`, so only views that read `store.name` re-evaluate when `name` changes. `ObservableObject` publishes at the object level, so changing one `@Published` property can invalidate every view observing the object.

Use focused `ObservableObject` stores when supporting older OS versions:

```swift
final class SearchStore: ObservableObject {
    @Published var query = ""
    @Published var results: [ResultItem] = []
}
```

Then inject the narrow store only into the subviews that need it.

## Reduce Re-evaluations

Extract subviews around independent state. Keep local toggles, focus state, hover state, and editing state as low as possible in the tree.

```swift
struct ProfileView: View {
    let user: User

    var body: some View {
        VStack {
            NameSection(name: user.name)
            BioSection(bio: user.bio)
        }
    }
}

private struct NameSection: View {
    let name: String
    @State private var isEditing = false

    var body: some View {
        HStack {
            Text(name)
            Button("Edit") { isEditing.toggle() }
        }
    }
}
```

Use `.equatable()` only when the view has a meaningful, cheap equality check and expensive body work:

```swift
struct ChartView: View, Equatable {
    let snapshot: ChartSnapshot

    static func == (lhs: Self, rhs: Self) -> Bool {
        lhs.snapshot.version == rhs.snapshot.version
    }

    var body: some View {
        ComplexChart(snapshot: snapshot)
    }
}
```

## Environment Reads

Environment changes can invalidate large subtrees. Remove environment properties from views that do not use them in `body`, and pass derived values only where needed.

```swift
struct ItemRow: View {
    let item: Item

    var body: some View {
        Text(item.title)
    }
}
```

## Acceptable Counts

| Scenario | Expected | Concerning |
| --- | --- | --- |
| View appears once | 1-2 evaluations | More than 5 without interaction |
| Typing in a field | Field and nearby dependent views update | Many unrelated sections update |
| Scrolling 100 rows | Visible rows plus prefetch | Every row evaluates at once |
| Button tap | Affected views update | Whole screen updates for local state |

## Fix Order

1. Confirm which dependency changed with `_printChanges()`.
2. Move state down or split the view if unrelated sections update.
3. Narrow observation by using `@Observable`, focused stores, or smaller observed subviews.
4. Remove unused environment reads.
5. Add `.equatable()` only after the dependency flow is clean.
