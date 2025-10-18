## YouTube Demo Structure & Key Points: Natural Language Commands VS Code Extension

### 1. Introduction
- Briefly introduce yourself and the extension
- State the problem: "Ever wish you could control VS Code with natural language?"
- Explain what the extension does in one sentence

### 2. Installation & Setup
- Show how to install the extension from the VS Code Marketplace
- Demonstrate setting up the OpenAI API key (show the command palette and secure storage)
- Mention the need for a `.env` file if not using SecretStorage

### 3. Core Features Demo
- **Natural Language Command Execution**
	- Run a command like "Open the file menu" and show simulated menus via QuickPick
	- Demonstrate running a terminal command with natural language ("Open the terminal and run my tests")
- **Sidebar & Menu Navigation**
	- Open sidebars and panels using natural language
	- Show fallback behavior for unsupported native menus
- **Command History & Examples**
	- Show the custom sidebar for command history and example commands
	- Demonstrate recalling and re-running previous commands
- **Confirmation & Safety**
	- Show confirmation before running destructive commands
	- Demonstrate suggestions/alternatives when LLM confidence is low

### 4. Advanced Features
- Show translation of Unix-style commands to PowerShell if on Windows
- Mention session-based and persistent history
- Briefly touch on extensibility (future voice input, etc.)

### 5. Troubleshooting & Tips
- What to do if the API key is missing or invalid
- How to view debug info and raw LLM responses (if enabled)
- Mention limitations (no native menu opening, API key required)

### 6. Conclusion & Call to Action
- Recap the benefits: speed, flexibility, and natural workflow
- Invite viewers to try the extension, give feedback, and check the docs
- Mention where to find more info (GitHub, Marketplace, etc.)

---

## Example Script/Outline (Markdown)

```markdown
# YouTube Demo Outline: Natural Language Commands VS Code Extension

## 1. Introduction
- Welcome & quick overview
- What problem does this solve?

## 2. Installation & Setup
- Install from Marketplace
- Set up OpenAI API key
- Note on .env file

## 3. Core Features Demo
- Run natural language commands
- Simulated menus (File/Edit/View/etc.)
- Terminal command translation
- Sidebar navigation
- Command history & examples
- Confirmation for destructive actions

## 4. Advanced Features
- PowerShell translation
- Persistent history
- Extensibility

## 5. Troubleshooting & Tips
- API key issues
- Debugging
- Limitations

## 6. Conclusion & Call to Action
- Recap benefits
- Invite feedback
- Where to find more info
```

---

**Tips:**
- For each section, show real usage in VS Code, narrate clearly, and keep each demo concise.
- Highlight unique features and user value.
- End with a call to action and links to docs/marketplace.