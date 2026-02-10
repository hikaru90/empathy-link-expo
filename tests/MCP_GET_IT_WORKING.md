# Get the browser / Playwright MCP working

The agent needs **element refs** from a **snapshot** to click and fill in the browser. Right now the snapshot response often doesn’t reach the agent (you see “Unsupported content type” or only metadata). Here’s what to do so the MCP works and the agent can drive the learn flow.

---

## 1. Fix Chrome DevTools MCP (recommended – snapshots can be saved to a file)

Chrome DevTools MCP can write the snapshot to a file so the agent can read refs from it. It’s currently failing with “The browser is already running…”.

**Do this:**

1. Open **Cursor Settings → MCP** (or edit `~/.cursor/mcp.json`).
2. Find the **chrome-devtools** server and add `--isolated` to its args.

**Before:**
```json
"chrome-devtools": {
  "command": "npx",
  "args": ["chrome-devtools-mcp@latest"]
}
```

**After:**
```json
"chrome-devtools": {
  "command": "npx",
  "args": ["chrome-devtools-mcp@latest", "--isolated"]
}
```

3. **Restart Cursor** (or restart the MCP servers).
4. If it still says “browser is already running”, **quit any Chrome window that was opened by the Chrome DevTools MCP**, then try again.

Then the agent can use Chrome DevTools’ `take_snapshot` with `filePath` (e.g. `tests/mcp-snapshot.txt`) and read refs from that file to click/fill.

---

## 2. Make sure the app and backend are running

- **Expo web:** `npx expo start --web` (or your usual start command) so the app is on `http://localhost:8081`.
- **PocketBase / backend:** running so login and learn data work.

---

## 3. What “snapshot” and “refs” mean

- **Snapshot** = the MCP tool that returns the accessibility tree of the page (list of elements: buttons, inputs, links, with names and refs).
- **Ref** = the unique id the MCP assigns to each element. The agent must pass that ref to `click` or `fill` (e.g. “click ref abc123”).
- So: **snapshot first → get refs → then click/fill using those refs.** The MCP is designed to work that way.

---

## 4. If the agent still doesn’t get refs

- **Cursor/UI:** When you run the snapshot tool, check if the **full snapshot** (the tree with refs) is shown in Cursor’s MCP or tool output panel. If it’s only “Unsupported content type” or metadata, Cursor may not be passing the full response to the agent. Check Cursor settings or updates for “MCP response” / tool output.
- **Use Chrome DevTools MCP with file:** After adding `--isolated`, ask the agent to use Chrome DevTools’ snapshot with `filePath: "tests/mcp-snapshot.txt"` and then to read that file for refs and continue the learn flow.

---

## 5. Summary

| Step | Action |
|------|--------|
| 1 | Add `"--isolated"` to chrome-devtools args in `~/.cursor/mcp.json`. |
| 2 | Restart Cursor (or MCP). Close any Chrome window opened by Chrome DevTools MCP if you still see “browser already running”. |
| 3 | Start the app and backend. |
| 4 | Ask the agent to test the learn flow again; it can use Chrome DevTools snapshot with `filePath` and read refs from the file. |

The MCP server **does** work; the main issue is the snapshot content (with refs) not reaching the agent. Fixing Chrome DevTools and using snapshot-to-file avoids that.
