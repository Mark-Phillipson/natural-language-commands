# Testing Guide for Confirmation Display Feature

## Overview

This guide explains how to manually test the confirmation display feature to ensure all command execution paths properly display the actual command before execution.

## Prerequisites

- VS Code installed
- Extension development environment set up
- OpenAI API key configured (for LLM functionality)

## Test Scenarios

### 1. VS Code Command with Medium Confidence

**Steps:**
1. Open VS Code with the extension loaded (F5 in development)
2. Run command: `NLC: Run Command...`
3. Enter: "toggle sidebar"
4. Expected: Confirmation dialog appears with message: `Run command "workbench.action.toggleSidebarVisibility"? (confidence XX%)`
5. Verify: The exact VS Code command is displayed
6. Click "Yes" to execute or "No" to cancel

**Expected Results:**
- Modal dialog shows the exact command
- Confidence percentage is displayed
- Command executes only if "Yes" is clicked

### 2. VS Code Command with High Confidence (Auto-Execute)

**Steps:**
1. Run command: `NLC: Run Command...`
2. Enter: "show explorer" (clear, unambiguous request)
3. Expected: If confidence >= autoAccept threshold (default 0.9), shows info message: `Auto-executing command (confidence XX% ≥ 90%): workbench.view.explorer`
4. Verify: The command is shown in the message
5. Command executes automatically

**Expected Results:**
- Info message shows the exact command being auto-executed
- Command executes without confirmation (if confidence is high enough)

### 3. Terminal Command with alwaysConfirmTerminalCommands = true (default)

**Steps:**
1. Run command: `NLC: Run Command...`
2. Enter: "run npm test in terminal"
3. Expected: Warning dialog appears: `Run terminal command "npm test"?`
4. Verify: The exact terminal command is displayed
5. Click "Yes" to execute or "No" to cancel

**Expected Results:**
- Modal warning dialog (yellow icon) shows the exact terminal command
- Command executes in terminal only if "Yes" is clicked
- Terminal is shown and command is sent

### 4. Alternative Command Selection (Low Confidence)

**Steps:**
1. Run command: `NLC: Run Command...`
2. Enter an ambiguous command like: "save"
3. Expected: QuickPick shows numbered alternatives
4. Select an alternative from the list
5. Expected: Confirmation dialog appears: `Run command "workbench.action.files.save"?`
6. Verify: The selected command is displayed
7. Click "Yes" to execute or "No" to cancel

**Expected Results:**
- QuickPick shows alternatives with commands visible
- After selection, confirmation shows the exact command
- Command executes only if confirmed

### 5. Alternative Terminal Command Selection

**Steps:**
1. Run command: `NLC: Run Command...`
2. Enter: "list files"
3. If LLM returns terminal command alternatives
4. Select an alternative (e.g., "ls -la")
5. Expected: Confirmation dialog: `Run terminal command "ls -la"?` (or "dir" on Windows)
6. Click "Yes" to execute or "No" to cancel

**Expected Results:**
- Confirmation shows the translated command (dir on Windows, ls on Unix)
- Terminal opens and executes only if confirmed

### 6. New Command Handler (`.new` command)

**Steps:**
1. Run command: `NLC: New Command`
2. Enter a direct command without history
3. If confidence is medium: Expected confirmation with command
4. If confidence is high: Expected auto-execute message with command
5. Verify command is always displayed

**Expected Results:**
- Behaves identically to `.run` handler
- Respects confidence thresholds
- Always shows the command being executed

### 7. Dangerous Terminal Command

**Steps:**
1. Run command: `NLC: Run Command...`
2. Enter: "delete all files" (LLM might interpret as rm/del command)
3. Expected: Confirmation dialog with the dangerous command shown
4. Verify: Clear warning about what will be executed

**Expected Results:**
- Terminal commands always show confirmation when `alwaysConfirmTerminalCommands` is true
- User can clearly see the dangerous command before confirming
- Extra safety layer prevents accidental execution

### 8. Configuration Testing

#### Test autoAccept = 1.0 (Always Confirm)

**Steps:**
1. Open VS Code settings
2. Set `naturalLanguageCommands.confidenceThresholds.autoAccept` to `1.0`
3. Run command: `NLC: Run Command...`
4. Enter: "show explorer"
5. Expected: Confirmation dialog appears even for high confidence

**Expected Results:**
- All commands require confirmation regardless of confidence
- Confirmation shows the exact command

#### Test alwaysConfirmTerminalCommands = false

**Steps:**
1. Open VS Code settings
2. Set `naturalLanguageCommands.alwaysConfirmTerminalCommands` to `false`
3. Run command: `NLC: Run Command...`
4. Enter: "run npm test"
5. Expected: If confidence >= autoAccept, command might auto-execute
6. Verify: Even in auto-execute, the command is shown in the message

**Expected Results:**
- High-confidence terminal commands may auto-execute
- Command is still displayed in the info message

## Verification Checklist

For each test scenario, verify:

- [ ] The exact command is displayed before execution
- [ ] Modal dialogs have "Yes" and "No" buttons
- [ ] Clicking "No" or cancelling prevents execution
- [ ] Clicking "Yes" executes the command
- [ ] Auto-execute messages clearly show the command
- [ ] Terminal commands are translated correctly (dir on Windows, ls on Unix)
- [ ] Unknown commands show clear error messages
- [ ] Dangerous commands show warnings

## Common Issues to Watch For

1. **Missing Command in Dialog**: If confirmation doesn't show the command, this is a bug
2. **Wrong Command Displayed**: Command should match what will actually execute
3. **No Confirmation When Expected**: Check confidence thresholds and settings
4. **Auto-Execute When Should Confirm**: Check autoAccept threshold setting

## Automated Tests

Run the automated test suite:

```bash
npm run compile  # Compile TypeScript
npm run test     # Run tests in VS Code extension host
```

The test suite in `src/test/confirmation.test.ts` covers:
- Confirmation message formats
- Alternative command confirmations  
- Terminal command safety
- Confidence threshold behavior
- Cancellation handling

## Configuration Reference

Default settings:
```json
{
  "naturalLanguageCommands.confidenceThresholds": {
    "autoAccept": 0.9,
    "confirm": 0.7
  },
  "naturalLanguageCommands.alwaysConfirmTerminalCommands": true
}
```

To always require confirmation for all commands:
```json
{
  "naturalLanguageCommands.confidenceThresholds": {
    "autoAccept": 1.0
  }
}
```

## Reporting Issues

If you find any scenario where the command is not displayed or confirmation doesn't work as expected, please report with:
1. The exact user input
2. The LLM response (if visible in debug mode)
3. What was displayed vs what was expected
4. Your configuration settings
