# Copilot AI Agent Instructions for `natural-language-commands`

## Project Overview
- This is a VS Code extension enabling users to run commands using natural language, powered by OpenAI LLMs (default: gpt-4o).
- The extension interprets user input, maps it to VS Code commands, and provides suggestions or alternatives if confidence is low.
- Simulated menus for File/Edit/View/etc. are provided via QuickPick, as VS Code API does not allow opening native top menus.
- Command history and example commands are shown in a custom sidebar (see `commandHistoryProvider.ts`).

## Key Files & Structure
- `src/extension.ts`: Main entry point, registers commands, handles user input, LLM integration, and command execution.
- `src/llm.ts`: Handles LLM API calls and response parsing.
- `src/sidebarMap.ts`: Maps natural language to sidebar/activity bar commands.
- `src/commandHistoryProvider.ts`: Implements command history and example commands sidebar views.
- `src/notificationManager.ts`: Manages status bar alerts and notifications.
- `package.json`: Declares extension commands, views, configuration, and scripts.

## Developer Workflows
- **Build:** `npm run compile` (one-time) or `npm run watch` (continuous, recommended for dev)
- **Test:** `npm run test` (ensure `npm run watch` is running for test discovery)
- **Debug:** Use VS Code launch config "Run Extension" (F5) to open a new window with the extension loaded.
- **Lint:** `npm run lint`

## Project-Specific Patterns
- All user-facing commands are registered in `extension.ts` and declared in `package.json`.
- Simulated menus (File, Edit, etc.) use QuickPick to present common actions, as native menus cannot be opened.
- LLM intent parsing is centralized in `getLLMResult` (see `llm.ts`).
- Fallbacks for sidebar navigation and menu simulation are handled in `sidebarMap.ts`.
- Command history is session-based and also stored in globalState for recall.
- Environment variables (e.g., `OPENAI_API_KEY`) are loaded from `.env` in the extension root.

## Integration Points
- OpenAI API (via `openai` npm package) for LLM intent recognition.
- VS Code API for command execution, QuickPick UI, and sidebar views.
- No direct voice input yet, but architecture allows for future speech-to-text integration.

## Examples
- "Open the file menu" → Simulated File menu QuickPick
- "Show all sidebars" → Sidebar picker
- "Open the terminal and run my tests" → LLM maps to terminal command(s)
- "Show command history sidebar" → Focuses custom sidebar view

## Conventions
- All new commands should be registered in both `extension.ts` and `package.json`.
- Use QuickPick for any simulated menu or alternative selection.
- Always confirm before executing potentially destructive commands.
- Store user history in both session and globalState for recall.

## Limitations
- Native top menus cannot be opened (simulate via QuickPick only).
- Requires valid OpenAI API key in `.env`.
- Voice input is not yet implemented.

---
For more details, see `README.md`, `Specification.md`, and `ActionPlan.md`.
