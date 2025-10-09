import * as vscode from 'vscode';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { getLLMResult, LLMResult } from './llm';
import { mapSidebarCommand } from './sidebarMap';
import { NotificationManager } from './notificationManager';

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	// Load environment variables from .env file in extension root
	const extRoot = context.extensionPath;
	dotenv.config({ path: path.join(extRoot, '.env') });

	// Initialize NotificationManager
	const notificationManager = new NotificationManager(context);

	// Register the main natural language command
	const disposable = vscode.commands.registerCommand('natural-language-commands.run', async () => {
		// Show an input box to the user for natural language command
		const userInput = await vscode.window.showInputBox({
			prompt: 'Enter a command in natural language (e.g., "Open the terminal and run my tests")',
			placeHolder: 'Describe what you want to do...'
		});
		if (!userInput || userInput.trim().length === 0) {
			vscode.window.showInformationMessage('No command entered.');
			return;
		}
		try {
			const apiKey = process.env.OPENAI_API_KEY;
			if (!apiKey) {
				vscode.window.showErrorMessage('OpenAI API key not found. Please set OPENAI_API_KEY in your .env file.');
				return;
			}
			// Read model and debug settings from VS Code configuration
			const config = vscode.workspace.getConfiguration();
			const model = config.get<string>('naturalLanguageCommands.model', 'gpt-4o');
			const debugShowRaw = config.get<boolean>('naturalLanguageCommands.debugShowRawResponse', false);
			const start = Date.now();
			const parsed = await getLLMResult(apiKey, userInput, model);
			const duration = Date.now() - start;
			vscode.window.showInformationMessage(`LLM response time: ${duration} ms`);
			if (debugShowRaw && parsed.rawResponse) {
				vscode.window.showInformationMessage(`Raw LLM response: ${JSON.stringify(parsed.rawResponse)}`);
			}
			vscode.window.showInformationMessage(`LLM result: ${JSON.stringify(parsed)}`);
			// If the LLM intent is to show a notification, add it to the queue
			if (parsed.intent && /notification|alert|status bar/i.test(parsed.intent)) {
				notificationManager.addNotification(parsed.intent);
			}
			const confidence = parsed.confidence;
			const altCommands = parsed.alternatives;

			// After all main command/terminal/alt logic, before fallback mapping:
			if (altCommands && altCommands.length > 0) {
				// Number the alternatives and show a quick pick for keyboard selection
				const numbered = altCommands.map((alt, idx) => {
					let label = `${idx + 1}. `;
					if (alt.command) { label += `Command: ${alt.command}`; }
					if (alt.terminal) { label += ` Terminal: ${alt.terminal}`; }
					if (alt.description) { label += ` — ${alt.description}`; }
					return { label, alt, idx };
				});
				const pick = await vscode.window.showQuickPick(numbered, {
					placeHolder: 'Select a command to run (type the number and press Enter)',
					ignoreFocusOut: true,
				});
				if (pick) {
					const selected = pick.alt;
					if (selected.command && selected.command.trim().length > 0) {
						const trimmed = selected.command.trim();
						vscode.window.showInformationMessage(`Executing command: ${trimmed}`);
						const result = await vscode.commands.executeCommand(trimmed);
						if (result !== undefined) {
							vscode.window.showInformationMessage(`Command executed successfully: ${trimmed}`);
						} else {
							vscode.window.showWarningMessage(`Command not found or failed: ${trimmed}`);
						}
					} else if (selected.terminal && selected.terminal.trim().length > 0) {
						const trimmed = selected.terminal.trim();
						vscode.window.showInformationMessage(`(Simulated) Would execute terminal command: ${trimmed}`);
						// Add terminal execution logic here if needed
					}
					return;
				}
			} else {
				// Fallback: try to map sidebar/activity bar requests
				const mapped = mapSidebarCommand(userInput);
				if (mapped) {
					vscode.window.showInformationMessage(`Sidebar fallback triggered: ${mapped}`);
					vscode.commands.executeCommand(mapped);
					vscode.window.showInformationMessage(`Executed VS Code command (sidebar fallback): ${mapped}`);
					return;
				} else {
					vscode.window.showInformationMessage('Sidebar fallback not triggered. No mapping found.');
				}
			}
		}
		catch (err: any) {
			vscode.window.showErrorMessage(`OpenAI API error: ${err.message || err}`);
		}
	});
	context.subscriptions.push(disposable);
}






