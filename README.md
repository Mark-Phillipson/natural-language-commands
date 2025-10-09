## Limitations

**Opening the native File menu (with focus on the first item) is not supported by VS Code extensions.**

This is a limitation of the VS Code API for security and cross-platform reasons. As a workaround, the extension provides a simulated File menu with common file actions via a QuickPick. You can access this by saying "open the file menu" or similar.

**Opening the native Terminal menu (the top menu) is also not supported by VS Code extensions.**

If you say "open terminal menu" or similar, the extension will show a simulated Terminal menu with common terminal actions. If you say "open terminal" or "show terminal", it will toggle the integrated terminal at the bottom of the window.

**Summary:**
- "Terminal menu" = top menu (simulated)
- "Open terminal" = integrated terminal
# Natural Language Commands for VS Code

This extension lets you run VS Code commands using natural language. It integrates with OpenAI models (default: gpt-4o) to interpret your requests and map them to editor actions.

## Features
- Run VS Code or terminal commands using plain English
- Choose your preferred OpenAI model
- Debug mode to show raw LLM responses
- Keyboard-friendly command alternatives
- Status bar alert icon for notifications

## Extension Settings
- `naturalLanguageCommands.model`: OpenAI model to use (default: gpt-4o)
- `naturalLanguageCommands.debugShowRawResponse`: Show raw LLM response (default: false)

## Known Issues
- None currently reported

## Release Notes
### 1.0.0
Initial release with core features

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
