# Copilot AI Agent Instructions for `natural-language-commands`

## Project Overview
This VS Code extension enables users to run commands using natural language, powered by OpenAI LLMs (default: gpt-4o). It interprets user input, maps it to VS Code commands or terminal actions, and provides suggestions or alternatives if confidence is low. Simulated menus for File/Edit/View/etc. are provided via QuickPick, as VS Code API does not allow opening native top menus. Command history and example commands are shown in a custom sidebar.

## Architecture & Key Components
- **`src/extension.ts`**: Main entry point. Registers all commands, handles user input, LLM integration, command execution, and simulated menus. All user-facing commands must be registered here and in `package.json`.
- **`src/llm.ts`**: Handles OpenAI API calls and parses LLM responses. Centralizes intent parsing via `getLLMResult`.
- **`src/sidebarMap.ts`**: Maps natural language to sidebar/activity bar commands and menu simulation fallbacks.
- **`src/commandHistoryProvider.ts`**: Implements session-based and persistent command history, plus example commands sidebar views.
- **`src/notificationManager.ts`**: Manages status bar alerts and notifications.
- **`package.json`**: Declares extension commands, views, configuration, and scripts. All new commands must be added here.

## Developer Workflows
- **Build:** `npm run compile` (one-time) or `npm run watch` (continuous, recommended for dev)
- **Test:** `npm run test` (ensure `npm run watch` is running for test discovery)
- **Debug:** Use VS Code launch config "Run Extension" (F5) to open a new window with the extension loaded
- **Lint:** `npm run lint`

## Project-Specific Patterns & Conventions
- **Simulated Menus:** Native top menus (File, Edit, etc.) cannot be opened. Use QuickPick to present common actions. See `extension.ts` for menu simulation patterns.
- **LLM Integration:** All natural language input is parsed by `getLLMResult` in `llm.ts`. The LLM response may include a VS Code command, a terminal command, or alternatives. Always check for alternatives and confidence before executing.
- **Sidebar/Panel Navigation:** Fallbacks for sidebar navigation and menu simulation are handled in `sidebarMap.ts`.
- **Command History:** Session-based and persistent (globalState) command history is managed in `commandHistoryProvider.ts` and surfaced in a custom sidebar. Example commands are also provided here.
- **Environment Variables:** The OpenAI API key (`OPENAI_API_KEY`) is loaded from `.env` in the extension root. The extension will not function without it.
- **Terminal Command Translation:** When running in PowerShell, Unix-style commands are translated to PowerShell equivalents (see `translateToPowerShell` in `extension.ts`).
- **Confirmation:** Always confirm before executing potentially destructive commands. Suggestions and alternatives are shown if LLM confidence is low.

## Integration Points
- **OpenAI API** (via `openai` npm package) for LLM intent recognition
- **VS Code API** for command execution, QuickPick UI, sidebar views, and notifications
- **No direct voice input yet**, but the architecture allows for future speech-to-text integration

## Examples & Usage Patterns
- "Open the file menu" → Simulated File menu QuickPick
- "Show all sidebars" → Sidebar picker
- "Open the terminal and run my tests" → LLM maps to terminal command(s)
- "Show command history sidebar" → Focuses custom sidebar view
- "Find all TODO comments in the workspace" → LLM may map to search or command

## Limitations
- Native top menus cannot be opened (simulate via QuickPick only)
- Requires valid OpenAI API key in `.env`
- Voice input is not yet implemented

---
For more details, see `README.md`, `Specification.md`, and `ActionPlan.md`.
