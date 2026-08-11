# Super Admin CLI

A terminal tool for managing super admin accounts on the SCH HUB platform.
All commands go through the backend REST API — no direct database access.

## Requirements

- Backend server must be running (`npm run dev`)
- Node.js 18+ (uses native `fetch`)
- `tsx` installed (already in devDependencies)

## Quick Start

```bash
# 1. Login — session is saved automatically
npm run admin login your@email.com

# 2. Run any command straight away — no export needed
npm run admin list

# 3. Logout when done
npm run admin logout
```

The session is stored in `scripts/.admin-session` (gitignored, chmod 600).
It is valid for 15 minutes (configured by `ACCESS_TOKEN_TTL` in `.env`).
When it expires, just run `login` again.

---

## Commands

### `login <email>`

Authenticate as a super admin. The session token is saved automatically to
`scripts/.admin-session` — no copy-pasting or `export` needed.

```bash
npm run admin login super@schub.app
```

---

### `logout`

Clear the saved session.

```bash
npm run admin logout
```

---

### `list`

List all super admin accounts with their status.

```bash
npm run admin list
```

Example output:

```
──────────────────────────────────────────────────────────────────────
  Name    : Jane Doe
  Email   : jane@schub.app
  ID      : clx1abc23def456
  Status  : 🟢 active
  Created : 8/3/2026, 9:00:00 PM
──────────────────────────────────────────────────────────────────────
```

Status indicators:
- 🟢 active — account is fully operational
- 🟡 inactive — account has been deactivated
- 🔴 blocked — account has been blocked

---

### `create`

Create a new super admin account interactively.

```bash
npm run admin create
```

Prompts for full name, email, and password (with confirmation). The new account
is immediately active with no email verification step required.

---

### `delete <adminId>`

Delete a super admin account by their ID. Asks for `YES` confirmation before
proceeding. All active sessions for that account are invalidated.

```bash
npm run admin delete clx1abc23def456
```

> Use `npm run admin list` to find the admin's ID first.

---

### `reset-password <adminId>`

Set a new password for a super admin. All their existing sessions are
invalidated immediately after the reset.

```bash
npm run admin reset-password clx1abc23def456
```

Prompts for the new password twice for confirmation.

---

### `stats`

View platform-wide analytics (total users, schools, materials, activity, etc.).

```bash
npm run admin stats
```

---

### `schools`

List all schools registered on the platform.

```bash
npm run admin schools
```

---

## Typical Session

```bash
# Start the backend
npm run dev

# In another terminal — login once
npm run admin login super@schub.app

# Run commands freely
npm run admin list
npm run admin create
npm run admin reset-password clx1abc23def456
npm run admin delete clx9xyz78ghi000
npm run admin stats

# Logout when done
npm run admin logout
```

---

## Notes

- The session is saved to `scripts/.admin-session` (gitignored, permissions 600).
  It is never committed to version control.
- If you need to use the token in a script or CI, set `ADMIN_TOKEN` as an
  environment variable — it takes priority over the session file.
- All actions go through the same backend middleware as the web frontend —
  role checks, audit logging, and validation are always enforced.
- The server port defaults to `5000`. If you have changed `PORT` in your `.env`,
  the CLI picks it up automatically.
