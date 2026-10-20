# AI logs

AI tools (Claude Code) were allowed and used. Each file is one session, exported from the local
Claude Code transcript with `npm run ai-logs` ([scripts/ai-logs.mjs](../scripts/ai-logs.mjs)):
user messages and Claude's replies verbatim, tool calls collapsed to one line, tool outputs and model
reasoning omitted, secrets (API token) redacted.

| File                                         | Covers                                                                                                                |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| [`00-project-setup.md`](00-project-setup.md) | Preparing the empty skeleton **before** the task started: tooling, architecture, web/Netlify setup, CI. No task code. |
| `01-task.md`                                 | The 2-hour task itself.                                                                                               |
