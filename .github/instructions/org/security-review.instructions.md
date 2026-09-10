---
owner: "@appsec-team"
applyTo: "**"
enforcement: required
---

> **Org requirement.** These rules are mandatory across all repositories and cannot be overridden by repo-specific instructions.

# Security Review Guidelines

When reviewing or writing code, check for these vulnerabilities.

## Input Validation

- Never trust user input; validate + sanitize all external data
- Allowlists over denylists
- Validate server-side even if client-side validation exists

```typescript
// ❌ Bad: Direct use of user input
const query = `SELECT * FROM users WHERE id = ${req.params.id}`;

// ✅ Good: Parameterized query
const query = `SELECT * FROM users WHERE id = $1`;
await db.query(query, [req.params.id]);
```

## Authentication & Authorization

- Verify permissions before every data access
- Check ownership, not just authentication

```typescript
// ❌ Bad: Only checks if user is logged in
app.get('/document/:id', requireAuth, async (req, res) => {
  const doc = await Document.findById(req.params.id);
  return res.json(doc);
});

// ✅ Good: Checks ownership
app.get('/document/:id', requireAuth, async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (doc.ownerId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return res.json(doc);
});
```

## Sensitive Data

- Never log passwords, tokens, API keys, PII
- Never hardcode secrets; use env vars or secret managers
- Never commit secrets

```typescript
// ❌ Bad: Hardcoded API key
const apiKey = 'sk-1234567890abcdef';

// ✅ Good: Environment variable
const apiKey = process.env.API_KEY;
```

## SQL Injection

- Always use parameterized queries or ORM
- Never concatenate user input into SQL strings

## XSS (Cross-Site Scripting)

- Escape all user-generated content before HTML render
- Use framework-provided escaping (React's JSX, etc.)
- Set Content-Security-Policy headers

## CSRF (Cross-Site Request Forgery)

- Use CSRF tokens for state-changing operations
- Validate Origin/Referer header

## Rate Limiting

- Rate-limit authentication endpoints
- Rate-limit expensive operations

## Red Flags to Always Report

- `// TODO: add auth` or similar comments
- Direct object references without ownership checks
- Password comparisons using `==` instead of constant-time comparison
- `eval()` or dynamic code execution with user input
- Disabled security features (SSL verification, CSRF protection)
