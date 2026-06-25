# Acceptance Tests

## Auth Persistence Tests

`scripts/test-auth-persistence.sh` tests the authentication and session management system.

### Prerequisites

- A running instance of the app (local or deployed)
- `curl` and `python3` installed
- A valid founder account (email + password)

### Usage

#### Against local dev server

```bash
npm run dev
# in another terminal:
bash scripts/test-auth-persistence.sh
```

#### Against a deployed URL

```bash
BASE_URL=https://my-project-one-rust-23.vercel.app \
  TEST_EMAIL=your@email.com \
  TEST_PASSWORD=yourpassword \
  bash scripts/test-auth-persistence.sh
```

### What it tests

| Test | Description |
|---|---|
| TEST 1 | Login → refresh → still logged in |
| TEST 2 | Login → logout → refresh → remain logged out |
| TEST 3 | Two browsers (cookie jars) — both logged in |
| TEST 4 | Logout browser A → browser B still works |

### Exit code

- `0` — all tests passed
- `1` — one or more tests failed

Use this in CI to gate deploys on auth correctness.
