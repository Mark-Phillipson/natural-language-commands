# Change Log

All notable changes to the "natural-language-commands" extension will be documented in this file.

## [Unreleased]

### Fixed
- **Chat interface message rendering** (CRITICAL): Fixed bug where messages were not visible in the webview
  - Changed newline replacement regex from `/\\n/g` to `/\n/g` to properly convert actual newlines to HTML `<br>` tags
  - Messages now display with proper formatting including bold text, code blocks, and line breaks
  - Without this fix, all message content appeared as a single line or didn't appear at all
- **Chat interface message sending**: Fixed webview message sending issues where users couldn't send messages
  - Changed deprecated `keypress` event to `keydown` for better reliability across browsers/webviews
  - Added `preventDefault()` to Enter key handler to prevent unwanted line breaks
  - Removed blocking `disabled` state on send button that prevented users from sending follow-up messages
  - Improved error recovery by allowing multiple message attempts without UI freezing

### Added
- **Debug logging**: Comprehensive console logging throughout chat message flow
  - Extension side: Logs message handling and sending to webview
  - Webview side: Logs message receiving, rendering, and DOM manipulation
  - Makes it easy to diagnose any issues by following the complete message lifecycle

### Added
- Simulated menus for File, Edit, Selection, View, Go, Run, Terminal, and Help (QuickPick UI)
- Sidebar/activity bar navigation with "Show all sidebars"
- Command history and example commands sidebar views
- PowerShell translation for terminal commands
- Status bar alert icon for notifications
- Confirmation and alternatives for low-confidence actions
- Support for OpenAI model selection and debug mode
- New commands:
	- `natural-language-commands.run`: Run Command... (main entry, with history)
	- `natural-language-commands.new`: New Command (direct input)
	- `natural-language-commands.debugMenu`: Debugging Commands (simulated menu)
	- `natural-language-commands.listTablesVoiceLauncher`: List all tables in VoiceLauncher DB
	- `natural-language-commands.examples`: Show example natural language commands
	- `nlc.fileMenu`: Simulated File menu
	- `nlc.editMenu`: Simulated Edit menu
	- `nlc.selMenu`: Simulated Selection menu
	- `nlc.viewMenu`: Simulated View menu
	- `nlc.goMenu`: Simulated Go menu
	- `nlc.runMenu`: Simulated Run menu
	- `nlc.termMenu`: Simulated Terminal menu
	- `nlc.helpMenu`: Simulated Help menu
	- `nlc.showSidebars`: Show all sidebars/activity bar items
	- `commandHistory.focus`: Show History Sidebar
	- `commandHistory.clearHistory`: Clear History
	- `commandHistory.reRunCommand`: Re-run from History
	- `commandHistory.deleteItem`: Delete from History

### Changed
- Updated documentation to reflect new features and commands
- Improved error handling and user feedback

### Fixed
- Various bug fixes and stability improvements