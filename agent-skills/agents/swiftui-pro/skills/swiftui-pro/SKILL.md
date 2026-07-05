---
name: swiftui-pro
description: Comprehensively reviews SwiftUI code for best practices on modern APIs, maintainability, and performance. Use when reading, writing, or reviewing SwiftUI projects.
license: MIT
argument-hint: "[focus area]"
metadata:
  author: Paul Hudson
  version: "1.0"
---

Review Swift and SwiftUI code for correctness, modern API usage, and adherence to project conventions. Report only genuine problems - do not nitpick or invent issues.

Review process:

1. Check for deprecated API using `${CLAUDE_SKILL_DIR}/references/api.md`.
1. Check that views, modifiers, and animations have been written optimally using `${CLAUDE_SKILL_DIR}/references/views.md`.
1. Validate that data flow is configured correctly using `${CLAUDE_SKILL_DIR}/references/data.md`.
1. Ensure navigation is updated and performant using `${CLAUDE_SKILL_DIR}/references/navigation.md`.
1. Ensure the code uses designs that are accessible and compliant with Apple's Human Interface Guidelines using `${CLAUDE_SKILL_DIR}/references/design.md`.
1. Validate accessibility compliance including Dynamic Type, VoiceOver, and Reduce Motion using `${CLAUDE_SKILL_DIR}/references/accessibility.md`.
1. Ensure the code is able to run efficiently using `${CLAUDE_SKILL_DIR}/references/performance.md`.
1. Quick validation of Swift code using `${CLAUDE_SKILL_DIR}/references/swift.md`.
1. Final code hygiene check using `${CLAUDE_SKILL_DIR}/references/hygiene.md`.

If doing a partial review, load only the relevant reference files.


## Core Instructions

- iOS 26 exists, and is the default deployment target for new apps.
- Target Swift 6.2 or later, using modern Swift concurrency.
- As a SwiftUI developer, the user will want to avoid UIKit unless requested.
- Do not introduce third-party frameworks without asking first.
- Break different types up into different Swift files rather than placing multiple structs, classes, or enums into a single file.
- Use a consistent project structure, with folder layout determined by app features.


## Output Format

Organize findings by file. For each issue:

1. State the file and relevant line(s).
2. Name the rule being violated (e.g., "Use `foregroundStyle()` instead of `foregroundColor()`").
3. Show a brief before/after code fix.

Skip files with no issues. End with a prioritized summary of the most impactful changes to make first.

Example output:

### ContentView.swift

**Line 12: Use `foregroundStyle()` instead of `foregroundColor()`.**

```swift
// Before
Text("Hello").foregroundColor(.red)

// After
Text("Hello").foregroundStyle(.red)
```

**Line 24: Icon-only button is bad for VoiceOver - add a text label.**

```swift
// Before
Button(action: addUser) {
    Image(systemName: "plus")
}

// After
Button("Add User", systemImage: "plus", action: addUser)
```

**Line 31: Avoid `Binding(get:set:)` in view body - use `@State` with `onChange()` instead.**

```swift
// Before
TextField("Username", text: Binding(
    get: { model.username },
    set: { model.username = $0; model.save() }
))

// After
TextField("Username", text: $model.username)
    .onChange(of: model.username) {
        model.save()
    }
```

### Summary

1. **Accessibility (high):** The add button on line 24 is invisible to VoiceOver.
2. **Deprecated API (medium):** `foregroundColor()` on line 12 should be `foregroundStyle()`.
3. **Data flow (medium):** The manual binding on line 31 is fragile and harder to maintain.

End of example.


## References

- `${CLAUDE_SKILL_DIR}/references/accessibility.md` - Dynamic Type, VoiceOver, Reduce Motion, and other accessibility requirements.
- `${CLAUDE_SKILL_DIR}/references/api.md` - updating code for modern API, and the deprecated code it replaces.
- `${CLAUDE_SKILL_DIR}/references/design.md` - guidance for building accessible apps that meet Apple's Human Interface Guidelines.
- `${CLAUDE_SKILL_DIR}/references/hygiene.md` - making code compile cleanly and be maintainable in the long term.
- `${CLAUDE_SKILL_DIR}/references/navigation.md` - navigation using `NavigationStack`/`NavigationSplitView`, plus alerts, confirmation dialogs, and sheets.
- `${CLAUDE_SKILL_DIR}/references/performance.md` - optimizing SwiftUI code for maximum performance.
- `${CLAUDE_SKILL_DIR}/references/data.md` - data flow, shared state, and property wrappers.
- `${CLAUDE_SKILL_DIR}/references/swift.md` - tips on writing modern Swift code, including using Swift Concurrency effectively.
- `${CLAUDE_SKILL_DIR}/references/views.md` - view structure, composition, and animation.
