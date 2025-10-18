

## 🔓 Accessibility & 🚀 Productivity

This extension is designed to make VS Code more accessible and productive for everyone:

- **Accessibility:** Users who have difficulty remembering command names, keyboard shortcuts, or menu navigation can simply use natural language to perform actions. This is especially helpful for people with less-than-perfect memory or cognitive challenges.
- **Productivity:** No need to memorize complex key combinations or search through menus—just describe what you want to do in plain English.
- **Discoverability:** The extension’s command history makes it easy to recall and reuse previous actions, further reducing cognitive load.


# 🤖 Natural Language Commands for VS Code

Created by Mark Phillipson

**Marketplace Category:** `Chat`

This extension lets you run VS Code commands using natural language. It integrates with OpenAI models (default: gpt-4o) to interpret your requests and map them to editor actions, simulated menus, and terminal commands.

## ✨ Features
* Categorized under **Chat** in the VS Code Marketplace for easy discovery
* 🗣️ Run VS Code or terminal commands using plain English
* 🗂️ Simulated menus for File, Edit, Selection, View, Go, Run, Terminal, and Help (via QuickPick)
* 🧭 Sidebar and activity bar navigation (including custom sidebars)
* 🕑 Command history sidebar
* 🤖 Choose your preferred OpenAI model
* 🐞 Debug mode to show raw LLM responses
* 🔔 Status bar alert icon for notifications
* 💻 PowerShell translation for terminal commands
* ⚠️ Confirmation and alternatives for low-confidence actions
* 🗑️ **File deletion via natural language always prompts for confirmation and logs the action in command history**

## 📝 Usage
### 💡 Example Natural Language Commands
* "Open the file menu"
* "Show the edit menu"
* "Show all sidebars"
* "Open the terminal and run my tests"
* "Show command history sidebar"
* "Find all TODO comments in the workspace"
* "Open the explorer"
* "Show me my extensions"
* "Switch to the source control view"
* "Open settings in JSON view"
* "Create a new file called hello.txt"
* "Show me the output panel"
* "Run the build task"
* "Show me the problems panel"
* "Open the debug console"
* "Clear the command history"
* "Delete the current document" *(will always prompt for confirmation and log the action in command history)*

### 🗂️ Simulated Menus
Native top menus (File, Edit, Selection, View, Go, Run, Terminal, Help) cannot be opened directly. Instead, this extension provides simulated menus via QuickPick with common actions for each menu. Just say or type e.g. "open the file menu" or "show the edit menu".

### 🧭 Sidebar Navigation
Say "show all sidebars" to get a filterable list of all sidebars (Explorer, Source Control, Run & Debug, Extensions, etc.) and focus the one you select.

### 🕑 Command History
The extension keeps a session-based and persistent command history, accessible via the custom sidebar.

## 🛠️ Extension Commands

| Command ID                                      | Title / Description                       |
|-------------------------------------------------|-------------------------------------------|
| natural-language-commands.run                   | Run Command... (main entry, with history) |
| natural-language-commands.new                   | New Command (direct input)                |
| natural-language-commands.debugMenu             | Debugging Commands (simulated menu)       |
| natural-language-commands.listTablesVoiceLauncher| List all tables in VoiceLauncher DB       |
| nlc.fileMenu                                    | Simulated File menu                       |
| nlc.editMenu                                    | Simulated Edit menu                       |
| nlc.selMenu                                     | Simulated Selection menu                  |
| nlc.viewMenu                                    | Simulated View menu                       |
| nlc.goMenu                                      | Simulated Go menu                         |
| nlc.runMenu                                     | Simulated Run menu                        |
| nlc.termMenu                                    | Simulated Terminal menu                   |
| nlc.helpMenu                                    | Simulated Help menu                       |
| nlc.showSidebars                                | Show all sidebars/activity bar items      |
| commandHistory.focus                            | Show History Sidebar                      |
| commandHistory.clearHistory                     | Clear History                             |
| commandHistory.reRunCommand                     | Re-run from History                       |
| commandHistory.deleteItem                       | Delete from History                       |

## ⚙️ Extension Settings
- `naturalLanguageCommands.model`: OpenAI model to use (default: gpt-4o)
- `naturalLanguageCommands.debugShowRawResponse`: Show raw LLM response (default: false)
- `naturalLanguageCommands.confidenceThresholds`: Object with `autoAccept` and `confirm` values (defaults: 0.9 and 0.7). Controls when commands are auto-executed, require confirmation, or show alternatives:
	- If confidence ≥ `autoAccept`, the command is auto-executed.
	- If confidence ≥ `confirm` but < `autoAccept`, you are asked for confirmation.
	- If confidence < `confirm`, alternatives are shown or the chat sidebar is opened.
	- Set `autoAccept` to 1 to always ask for confirmation (current behavior). Set to 0 to always auto-accept (advanced users only).
- `naturalLanguageCommands.alwaysConfirmTerminalCommands`: (default: true) When enabled, always ask for confirmation before executing terminal commands, regardless of confidence level. This provides an extra layer of security to prevent accidental execution of potentially destructive commands. Certain dangerous commands (like `rm`, `del`, `format`) will always require confirmation even if this setting is disabled.

## 🔒 Security

### Terminal Command Confirmation
By default, the extension will **always ask for confirmation** before executing any terminal command, regardless of the LLM's confidence level. This is controlled by the `alwaysConfirmTerminalCommands` setting (default: `true`).

When a terminal command is detected:
- **In the main command interface**: A modal dialog will appear asking you to confirm the command
- **In the chat interface**: The chat will ask "Do you want to run this terminal command? (yes/no)" and wait for your response

This feature is designed to prevent accidental execution of potentially destructive commands like:
- File deletion commands (`rm`, `del`, `Remove-Item`)
- Directory operations (`rmdir`, `rd`)
- System commands (`shutdown`, `reboot`, `format`)

⚠️ **Important**: Even if you disable `alwaysConfirmTerminalCommands`, dangerous commands will still require confirmation for your safety.


## 🗝️ Providing Your OpenAI API Key

This extension requires a valid OpenAI API key to function. You can provide your key in one of two ways:

### 1️⃣ Securely via the Command Palette (Recommended)

- 🔐 Run the command **"Set OpenAI API Key"** from the Command Palette (`Ctrl+Shift+P` > type "Set OpenAI API Key").
- 🗝️ Enter your OpenAI API key (it will be stored securely using VS Code's SecretStorage and never synced or exposed).
- ❌ To remove your key, run **"Remove OpenAI API Key"** from the Command Palette.

### 2️⃣ Using an Environment Variable

- 📝 Create a file named `.env` in the extension root folder (or your workspace root).
- ➕ Add the following line:
	```
	OPENAI_API_KEY=sk-...
	```
- 🔄 Restart VS Code after editing the `.env` file.

🔎 If both are set, the extension will use the key from secure storage first.

❓ If the key is missing, you will be prompted to set it using the command above.

## ⚠️ Limitations
- 🚫 Native top menus cannot be opened (simulated via QuickPick only)
- 🗝️ Requires valid OpenAI API key (see above)

## 🗣️ Voice Control
This extension can be used in conjunction with [Talon Voice](https://talonvoice.com/) to further enhance your workflow with hands-free, voice-driven commands in VS Code.

## 📝 Release Notes
### Unreleased
#### Added
- Simulated menus for File, Edit, Selection, View, Go, Run, Terminal, and Help (QuickPick UI)
- Sidebar/activity bar navigation with "Show all sidebars"
- Command history and example commands sidebar views
- PowerShell translation for terminal commands
- Status bar alert icon for notifications
- Confirmation and alternatives for low-confidence actions
- Support for OpenAI model selection and debug mode
- New commands for menu simulation, history, and examples

#### Changed
- Updated documentation to reflect new features and commands
- Improved error handling and user feedback

#### Fixed
- Various bug fixes and stability improvements

