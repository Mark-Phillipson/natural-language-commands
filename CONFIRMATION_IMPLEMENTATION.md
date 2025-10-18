# Confirmation Display Implementation

## Summary of Changes

This implementation ensures that all command execution paths display the actual command in confirmation prompts before execution, addressing the issue where users were not always seeing what command would be executed.

## Changes Made

### 1. Alternative Command Execution (`.run` handler)
**File: `src/extension.ts`** (lines ~798-830)

- **Before**: Alternative commands were executed immediately after selection with only an "Executing command" notification
- **After**: Shows a confirmation dialog with the exact command before execution
  ```typescript
  const confirmMsg = `Run command \"${trimmed}\"?`;
  const ok = await vscode.window.showInformationMessage(confirmMsg, { modal: true }, 'Yes', 'No');
  ```

### 2. Alternative Terminal Command Execution (`.run` handler)
**File: `src/extension.ts`** (lines ~808-830)

- **Before**: Alternative terminal commands were executed immediately after selection
- **After**: Shows a confirmation dialog with the exact terminal command before execution
  ```typescript
  const confirmMsg = `Run terminal command \"${trimmed}\"?`;
  const ok = await vscode.window.showWarningMessage(confirmMsg, { modal: true }, 'Yes', 'No');
  ```

### 3. `.new` Command Handler - VS Code Commands
**File: `src/extension.ts`** (lines ~959-987)

- **Before**: Commands were executed directly without any confirmation
- **After**: Respects confidence thresholds and shows confirmation when needed
  - High confidence (>= autoAccept and autoAccept < 1): Auto-executes with informational message showing the command
  - Lower confidence or autoAccept >= 1: Shows confirmation dialog with the command
  ```typescript
  const confirmMsg = `Run command \"${trimmed}\"?${typeof confidence === 'number' ? ` (confidence ${(confidence * 100).toFixed(1)}%)` : ''}`;
  const ok = await vscode.window.showInformationMessage(confirmMsg, { modal: true }, 'Yes', 'No');
  ```

### 4. `.new` Command Handler - Terminal Commands
**File: `src/extension.ts`** (lines ~990-1014)

- **Before**: Terminal commands were executed directly without confirmation
- **After**: Respects `alwaysConfirmTerminalCommands` setting
  - If setting is enabled (default): Always shows confirmation with the command
  - Provides extra safety for potentially destructive terminal commands
  ```typescript
  const confirmMsg = `Run terminal command \"${terminalCommand}\"?`;
  const ok = await vscode.window.showWarningMessage(confirmMsg, { modal: true }, 'Yes', 'No');
  ```

### 5. `.new` Command Handler - Alternative Commands
**File: `src/extension.ts`** (lines ~1040-1073)

- **Before**: Alternative commands in `.new` were executed immediately after selection
- **After**: Shows confirmation dialog with the exact command before execution (same pattern as `.run` handler)

## Test Coverage

### New Test File: `src/test/confirmation.test.ts`

Comprehensive test suite covering:

1. **VS Code Command Confirmation** - Verifies confirmation messages include the actual command
2. **Terminal Command Confirmation** - Verifies terminal command confirmations include the command
3. **Alternative Command Confirmation** - Tests alternative command selection requires confirmation
4. **Message Format Consistency** - Ensures all confirmations follow consistent format
5. **Auto-Execute Behavior** - Verifies auto-execute messages display the command
6. **Confirmation Options** - Tests Yes/No button presentation
7. **Unknown Command Handling** - Verifies unknown commands don't execute
8. **Cancellation Behavior** - Tests that cancelled confirmations don't execute commands
9. **Terminal Command Settings** - Verifies `alwaysConfirmTerminalCommands` setting is respected
10. **Dangerous Commands** - Tests that dangerous terminal commands always show confirmation
11. **Confidence Thresholds** - Validates confidence-based execution behavior

## Acceptance Criteria Met

✅ **The confirmation prompt always includes the actual command to be run**
- All confirmation dialogs now include the exact command: `Run command "${command}"?` or `Run terminal command "${command}"?`
- Auto-execute messages show the command being executed
- Alternative selection followed by confirmation shows the exact command

✅ **Unknown or ambiguous commands result in a clear error message and do not execute**
- Commands that are not found show warning: "Command not found or failed"
- Low confidence commands show alternatives instead of executing
- Cancelled confirmations prevent execution

✅ **Confirmation is always required before running certain terminal commands (depending on settings)**
- `alwaysConfirmTerminalCommands` setting (default: true) ensures terminal commands are always confirmed
- Terminal confirmations use warning dialogs for extra visibility
- Dangerous commands always require confirmation regardless of confidence

## Behavior Summary

### Main Command Handler (`.run`)
1. High confidence (≥ autoAccept, autoAccept < 1): Auto-executes VS Code commands with info message
2. Medium confidence (≥ confirm, < autoAccept): Shows confirmation with command
3. Low confidence (< confirm): Shows alternatives, which require confirmation when selected
4. Terminal commands: Always confirm if `alwaysConfirmTerminalCommands` is true

### New Command Handler (`.new`)
1. Now follows same confidence logic as `.run`
2. Terminal commands respect `alwaysConfirmTerminalCommands` setting
3. All alternatives require confirmation before execution

## Configuration

Users can control confirmation behavior via settings:

- `naturalLanguageCommands.confidenceThresholds.autoAccept` (default: 0.9)
  - Set to 1.0 to always require confirmation for VS Code commands
  - Set to 0.0 to always auto-execute (not recommended)
  
- `naturalLanguageCommands.confidenceThresholds.confirm` (default: 0.7)
  - Threshold between showing confirmation vs alternatives

- `naturalLanguageCommands.alwaysConfirmTerminalCommands` (default: true)
  - When true, always confirm terminal commands regardless of confidence
  - Provides safety against accidental destructive commands

## Testing

Run tests with:
```bash
npm run compile  # Compile TypeScript
npm run test     # Run tests in VS Code extension host
```

Note: Tests require VS Code extension host environment to run properly.
