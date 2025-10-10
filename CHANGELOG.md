# Change Log

All notable changes to the "natural-language-commands" extension will be documented in this file.

## [Unreleased]

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