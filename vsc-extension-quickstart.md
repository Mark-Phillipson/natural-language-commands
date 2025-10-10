
# Quickstart: Natural Language Commands for VS Code

## Getting Started

1. **Install the extension** in VS Code.
2. **Add your OpenAI API key** to a `.env` file in the extension root:
   ```env
   OPENAI_API_KEY=your-key-here
   ```
3. **Reload VS Code** to activate the extension.

## Usage

- Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and run `Natural Language Commands: Run Command...` to enter a natural language command.
- Use the sidebar to view command history and example commands.
- Try simulated menus by saying things like "open the file menu" or "show the edit menu".
- Use "show all sidebars" to quickly navigate to any sidebar/activity bar item.

## Example Commands

- "Open the terminal and run my tests"
- "Show the command history sidebar"
- "Open the explorer"
- "Show me my extensions"
- "Switch to the source control view"
- "Open settings in JSON view"
- "Create a new file called hello.txt"
- "Find all TODO comments in the workspace"
- "Show me the output panel"
- "Run the build task"
- "What is the current git branch?"
- "Show me the problems panel"
- "Open the debug console"
- "Show me the command palette"
- "Clear the command history"

## Settings

- `naturalLanguageCommands.model`: OpenAI model to use (default: gpt-4o)
- `naturalLanguageCommands.debugShowRawResponse`: Show raw LLM response (default: false)

## Limitations

- Native top menus cannot be opened (simulated via QuickPick only)
- Requires valid OpenAI API key in `.env`
- Voice input is not yet implemented

## For more information

- See the README.md for full documentation and command list.
