---
name: New Verb Proposal
about: Propose a new verb or verb family for the standard library
title: "[Verb] "
labels: new-verb
assignees: ""
---

## Verb ID

e.g. `ui.table.sort` or a new family like `data.export.*`

## Level

- [ ] Level 0 — Website UI Starter
- [ ] Level 1 — App Operations Starter
- [ ] Level 2 — Domain Pack

## Summary

One sentence: what does this verb do?

## Input Schema

```json
{
  "type": "object",
  "properties": {},
  "required": []
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {}
}
```

## Example Conversation Flow

1. User: "..."
2. AI calls `your.verb.id` with `{ ... }`
3. Result: `{ ... }`
4. AI: "..."

## Why This Should Be Standard

Why does every (or most) app(s) need this verb? Is it universal enough for the standard library?

## Alternatives

Could this be done with existing verbs? Why is a new one needed?
