# Caption glossary format

Store task-specific vocabulary in JSON:

```json
{
  "terms": [
    {
      "canonical": "Example Product",
      "aliases": ["ExampleProduct", "Example product"],
      "caseSensitive": false
    },
    {
      "canonical": "API",
      "aliases": ["A P I"],
      "caseSensitive": true
    }
  ]
}
```

## Rules

- `canonical` is required and is automatically recognized as an alias.
- `aliases` is required and contains only verified transcription variants.
- `caseSensitive` defaults to `false`.
- One normalized alias cannot map to two canonical terms.
- Longer aliases match first.
- Matches require non-alphanumeric boundaries, so a term is not replaced inside another word.
- Punctuation outside the matched phrase is preserved.

Keep client names, unpublished products, and personal vocabulary in the task-local glossary, not in this skill.
