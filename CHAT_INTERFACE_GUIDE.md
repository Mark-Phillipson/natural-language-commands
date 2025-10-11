# Chat Interface Guide

## Overview

The Natural Language Commands extension now includes a **chat-like feedback mechanism** that allows you to have a conversational interaction with the extension. This feature is part of Step 6 (Learning & Feedback Mechanism) from the Action Plan.

## Opening the Chat Interface

You can open the chat interface in several ways:

1. **Command Palette**: 
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "NLC: Open Chat Interface"
   - Press Enter

2. **Keyboard Shortcut**: 
   - You can assign a custom keyboard shortcut to `natural-language-commands.chat` in your VS Code settings

## Using the Chat Interface

### Basic Interaction

1. **Type a command** in natural language in the input box at the bottom
2. **Press Enter or click Send** to submit your command
3. The extension will:
   - Show a "Thinking..." indicator
   - Process your request using OpenAI
   - Display the suggested command(s) with details

### Understanding the Response

The chat will show you:
- **Intent**: What the extension understood you wanted to do
- **VS Code Command**: The specific VS Code command to execute (if applicable)
- **Terminal Command**: A terminal command to run (if applicable)
- **Confidence**: How confident the LLM is about the suggestion (0-100%)
- **Alternatives**: Other possible commands if the confidence is not 100%

### Executing Commands

Once you see a suggestion:
- Click **▶ Execute Command** to run the VS Code command
- Click **▶ Run in Terminal** to execute the terminal command
- The result will be shown as a system message in the chat

### Providing Feedback

After seeing a suggestion, you can provide feedback:

#### Positive Feedback
Click **👍 This is correct** if:
- The suggestion matched what you wanted
- The command executed successfully
- You're satisfied with the result

#### Negative Feedback
Click **👎 Not what I meant** if:
- The suggestion didn't match your intent
- The command didn't work as expected
- You want to refine your request

When you click the thumbs down button:
1. A prompt will appear asking "What did you mean? (Provide more details)"
2. Enter additional context or clarification
3. The extension will process your refinement and provide a new suggestion

### Multi-turn Conversation

The chat maintains conversation history within the session, so you can:
- Build on previous commands
- Refine your requests iteratively
- Provide context that carries through the conversation

## Examples

### Example 1: Simple Command
```
You: open the terminal and run npm test
Assistant: 
  Intent: Run npm test in the terminal
  Terminal Command: npm test
  Confidence: 95%
[▶ Run in Terminal] [👍 This is correct] [👎 Not what I meant]
```

### Example 2: Refinement
```
You: open settings
Assistant:
  Intent: Open VS Code settings
  VS Code Command: workbench.action.openSettings
  Confidence: 85%
[▶ Execute Command] [👍 This is correct] [👎 Not what I meant]

[You click 👎 Not what I meant]
You: (refinement) I meant to open the settings.json file directly
Assistant:
  Intent: Open settings JSON file
  VS Code Command: workbench.action.openSettingsJson
  Confidence: 98%
[▶ Execute Command] [👍 This is correct] [👎 Not what I meant]
```

### Example 3: Low Confidence with Alternatives
```
You: show me my stuff
Assistant:
  Intent: Display user content
  VS Code Command: workbench.view.explorer
  Confidence: 60%
  
  Alternatives:
  1. Command: workbench.view.extensions — View installed extensions
  2. Command: workbench.view.scm — View source control
  3. Terminal: ls — List files in current directory
[▶ Execute Command] [👍 This is correct] [👎 Not what I meant]
```

## Learning Mechanism

The chat interface includes a learning system:

### Feedback Storage
- Every time you provide feedback (👍 or 👎), it's stored locally
- The extension stores up to 100 feedback items
- Data includes:
  - Your original input
  - The LLM's suggestion
  - Whether it was correct
  - Any refinement you provided
  - Timestamp

### Privacy & Control
You can control the feedback mechanism through settings:

```json
{
  "naturalLanguageCommands.enableChatMode": true,  // Enable/disable chat interface
  "naturalLanguageCommands.enableFeedbackStorage": true  // Enable/disable feedback storage
}
```

### Future Improvements
The feedback data is designed to enable future enhancements such as:
- Local fine-tuning of command suggestions
- Personalized command mapping based on your usage patterns
- Sharing anonymized feedback for community improvements (opt-in)

## Tips for Best Results

1. **Be specific**: Instead of "open file", try "open the file explorer"
2. **Use natural language**: Write as if you're talking to a colleague
3. **Provide context**: "run my tests" → "open the terminal and run npm test"
4. **Refine when needed**: If the first suggestion isn't right, use the refinement feature
5. **Give feedback**: Your feedback helps improve future suggestions

## Troubleshooting

### Chat Interface Won't Open
- Ensure the extension is activated
- Check the command palette for "NLC: Open Chat Interface"
- Look for errors in the Developer Console (`Help > Toggle Developer Tools`)

### Commands Not Executing
- Verify you have the necessary permissions
- Check that VS Code commands are valid
- Review the terminal for error messages

### Slow Responses
- The extension uses OpenAI's API which requires internet connectivity
- Response time depends on your internet speed and OpenAI's API performance
- The model setting can affect speed (e.g., gpt-3.5-turbo is faster than gpt-4o)

## Settings

Customize the chat experience in your settings:

```json
{
  // OpenAI model to use
  "naturalLanguageCommands.model": "gpt-4o",
  
  // Enable chat interface
  "naturalLanguageCommands.enableChatMode": true,
  
  // Store feedback for learning
  "naturalLanguageCommands.enableFeedbackStorage": true,
  
  // Show raw LLM responses for debugging
  "naturalLanguageCommands.debugShowRawResponse": false
}
```

## Feedback & Support

If you encounter issues or have suggestions for the chat interface:
- Open an issue on the [GitHub repository](https://github.com/Mark-Phillipson/natural-language-commands)
- Include screenshots or examples if possible
- Describe what you expected vs. what happened

---

**Enjoy the enhanced conversational experience!** 🎉
