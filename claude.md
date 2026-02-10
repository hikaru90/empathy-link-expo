# Claude Instructions for Empathy Link Expo

## Working with the user

- **Take the user seriously and do exactly what they say.** Do not stray from their direct request.
- **If you have problems executing it or think a different approach is smarter: tell them.** Do not silently switch to a different approach. Propose the change; only proceed if they approve.
- **Never do something completely different from what they asked.** Stay on the requested task.
- **When the user asks a question: answer the question.** Do not deflect by trying to "fix" something or do extra work instead of answering.

## Authentication Credentials

When testing the app through the browser MCP server, use the login credentials from the `.env` file:

- **Email**: Use the value from `TEST_USERNAME` in `.env`
- **Password**: Use the value from `TEST_PASSWORD` in `.env`

### Usage Instructions

1. Read the `.env` file to get `TEST_USERNAME` and `TEST_PASSWORD`
2. Navigate to `http://localhost:8081/login`
3. Fill in the email field with the value from `TEST_USERNAME`
4. Fill in the password field with the value from `TEST_PASSWORD`
5. Click the login button
6. After login, navigate to `/stats` to see the stats page with the Top Bedürfnisse card

### Remember

- Always read credentials from the `.env` file - never hardcode them
- The `.env` file contains `TEST_USERNAME` and `TEST_PASSWORD` variables
- After making changes, verify them through the browser MCP server

## Playwright / Browser MCP

- **Never hide what the Playwright MCP (or browser MCP) is doing.** When using browser automation (navigate, click, snapshot, screenshot, etc.), always report the actions and their results to the user—e.g. which URL was opened, what was clicked, what the snapshot or screenshot shows, and any errors. Do not summarize or omit MCP tool output so the user can see exactly what the server is doing and debug failures.

## Principles

**Always look for the simplest solution first—and get it right.** Before adding dependencies, abstractions, or clever patterns, ask: what is the minimal fix?

**Verbose code is the worst.** It creates technical debt, hurts maintainability, and complicates everything. Prefer lean, minimal solutions over elaborate ones.

