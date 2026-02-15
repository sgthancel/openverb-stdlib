# Contributing to OpenVerb Standard Library

Thanks for your interest in contributing! OpenVerb is an open standard for AI-app interaction, and community contributions make it better for everyone.

## Ways to Contribute

### Report Issues

- Found a bug in a manifest? Open an issue.
- Unclear documentation? Open an issue.
- Missing a verb that every app needs? Open a feature request.

### Propose New Verbs

Use the **New Verb Proposal** issue template. A good proposal includes:

- The verb id (e.g. `ui.table.sort`)
- A one-line summary
- Input/output JSON schema
- An example conversation flow (User says X → AI calls verb → result)
- Which Level it belongs to (0, 1, or 2)

### Submit Code

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-verb`)
3. Make your changes
4. Run validation: `npm test`
5. Submit a pull request

## Project Structure

```
manifests/     JSON Schema verb definitions (one file per family)
docs/          Human-readable specs and patterns
reference/     Implementation examples (vanilla JS, React, Next.js)
scripts/       Build and validation scripts
```

## Manifest Format

Every manifest follows this structure:

```json
{
  "family": "ui.example",
  "version": "1.0.0",
  "verbs": [
    {
      "id": "ui.example.do_thing",
      "version": "1.0.0",
      "summary": "One-line description of what this verb does",
      "input": { "type": "object", "properties": {}, "required": [] },
      "output": { "type": "object", "properties": {} }
    }
  ]
}
```

### Naming Conventions

- Families use dot notation: `ui.theme`, `ui.nav`, `user.session`
- Verb ids use dot notation: `ui.theme.get`, `ui.nav.go`
- Use snake_case for multi-word verbs: `ui.nav.list_pages`
- Input/output property names use camelCase: `routeId`, `toastId`

### Design Rules

1. **Verbs return data, clients apply effects.** A verb like `ui.nav.go` returns `{ success: true, path: "/foo" }` — the client calls `router.push`.
2. **Use registries, not raw strings.** The AI should never guess URLs, modal ids, or form fields. Expose them via list verbs.
3. **Separate read from write.** `ui.form.fill` and `ui.form.submit` are separate verbs so the user can review before submitting.
4. **Destructive actions require confirmation.** `user.session.logout` requires `{ confirmed: true }`.
5. **Never expose secrets.** `user.session.get` returns display info, never tokens or passwords.

## Reference Implementations

When adding a new verb family, include handlers in all three reference implementations:

- `reference/vanilla/verbs.js`
- `reference/react/useOpenVerb.ts`
- `reference/nextjs/verbs.ts`

## Code Style

- We use Prettier for formatting (`npm run format`)
- TypeScript for React and Next.js references
- Plain JS for the vanilla reference
- 2-space indentation
- No semicolons in JSON manifests (they're JSON, not JS)

## Pull Request Checklist

- [ ] Manifest follows the standard format
- [ ] Input/output use JSON Schema types
- [ ] Verb summary is one clear sentence
- [ ] Docs updated in `docs/website-starter-verbs.md`
- [ ] Reference implementations updated (all 3)
- [ ] `npm test` passes

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold it.

## Questions?

Open a Discussion on GitHub or file an issue tagged `question`.
