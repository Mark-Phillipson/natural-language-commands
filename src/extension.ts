import * as vscode from 'vscode';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { getLLMResult, LLMResult } from './llm';
import { mapSidebarCommand } from './sidebarMap';
import { NotificationManager } from './notificationManager';
import { CommandHistoryProvider, CommandHistoryItem } from './commandHistoryProvider';


// Helper for command history
const HISTORY_KEY = 'nlc.commandHistory';
const HISTORY_LIMIT = 20;

export function activate(context: vscode.ExtensionContext) {
	// Set up command history provider for the sidebar
	const commandHistoryProvider = new CommandHistoryProvider();
	vscode.window.registerTreeDataProvider('commandHistoryView', commandHistoryProvider);
	// Register a command to focus/reveal the Command History sidebar
	let commandHistoryTreeView: vscode.TreeView<any> | undefined;
	context.subscriptions.push(
		vscode.commands.registerCommand('commandHistory.focus', async () => {
			try {
				// Focus the custom view container in the activity bar
				await vscode.commands.executeCommand('workbench.view.extension.commandHistoryContainer');
				vscode.window.showInformationMessage('[NLC DEBUG] Focused Command History Container.');
				// Focus the custom view itself (if needed)
				await vscode.commands.executeCommand('workbench.action.focusView.commandHistoryView');
				vscode.window.showInformationMessage('[NLC DEBUG] Focused Command History View.');
			} catch (err: any) {
				vscode.window.showErrorMessage(`[NLC ERROR] Could not reveal Command History Sidebar: ${err.message || err}`);
			}
		})
	);

	// Register clear and re-run commands for the sidebar
	context.subscriptions.push(
		vscode.commands.registerCommand('commandHistory.clearHistory', () => {
			commandHistoryProvider.clear();
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('commandHistory.reRunCommand', (item) => {
			if (item && item.item && item.item.label) {
				vscode.commands.executeCommand('natural-language-commands.run', item.item.label);
			}
		})
	);

	// Add search bar to the sidebar
	vscode.window.createInputBox().onDidChangeValue(value => {
		commandHistoryProvider.setFilter(value);
	});
	// Load environment variables from .env file in extension root
	const extRoot = context.extensionPath;
	dotenv.config({ path: path.join(extRoot, '.env') });

	// Initialize NotificationManager
	const notificationManager = new NotificationManager(context);

	// Register the main natural language command (with history QuickPick)
	const disposable = vscode.commands.registerCommand('natural-language-commands.run', async () => {
			vscode.window.showInformationMessage('[NLC DEBUG] Handler triggered for user input.');
		// Get history from globalState
		let history: string[] = context.globalState.get<string[]>(HISTORY_KEY) || [];
		// Prepare QuickPick items
		const quickPickItems: vscode.QuickPickItem[] = [
			{ label: '$(plus) Enter New Command', alwaysShow: true },
			...history.map(cmd => ({ label: cmd }))
		];
		// Show QuickPick for history/recall
		const pick = await vscode.window.showQuickPick(quickPickItems, {
			placeHolder: 'Press ↑ to recall previous commands or select "Enter New Command"',
			ignoreFocusOut: true,
		});
		let userInput: string | undefined;
		if (!pick) {
			return;
		} else if (pick.label === '$(plus) Enter New Command') {
			userInput = await vscode.window.showInputBox({
				prompt: 'Enter a command in natural language (e.g., "Open the terminal and run my tests")',
				placeHolder: 'Describe what you want to do...'
			});
		} else {
			// Picked a history item, allow editing
			userInput = await vscode.window.showInputBox({
				prompt: 'Edit and run previous command:',
				value: pick.label
			});
		}
		if (!userInput || userInput.trim().length === 0) {
			vscode.window.showInformationMessage('No command entered.');
			return;
		}
		// Update history: add to top, remove duplicates, trim to limit
		history = [userInput, ...history.filter(cmd => cmd !== userInput)].slice(0, HISTORY_LIMIT);
		await context.globalState.update(HISTORY_KEY, history);
		// Add to session sidebar history
		commandHistoryProvider.addCommand({
			label: userInput,
			time: new Date(),
			parameters: '' // You can enhance this to capture parameters if needed
		});

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
			// LLM semantic override: If isCommandHistorySidebar is true, always open sidebar and return
			if (parsed && parsed.isCommandHistorySidebar) {
				vscode.window.showInformationMessage('[NLC LLM SEMANTIC OVERRIDE] LLM flagged isCommandHistorySidebar: Opening Command History Sidebar (commandHistory.focus)');
				await vscode.commands.executeCommand('commandHistory.focus');
				return;
			}
			const duration = Date.now() - start;
			vscode.window.showInformationMessage(`LLM response time: ${duration} ms`);
			// Diagnostic logging for LLM result and intent/command
			vscode.window.showInformationMessage(`[NLC DEBUG] LLM result: ${JSON.stringify(parsed)}`);
			vscode.window.showInformationMessage(`[NLC DEBUG] intent: ${parsed?.intent}, command: ${parsed?.command}`);
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

			// If parsed.command is present, execute it directly
			if (parsed.command && typeof parsed.command === 'string' && parsed.command.trim().length > 0) {
				const trimmed = parsed.command.trim();
				vscode.window.showInformationMessage(`Executing command: ${trimmed}`);
				const result = await vscode.commands.executeCommand(trimmed);
				if (result !== undefined) {
					vscode.window.showInformationMessage(`Command executed successfully: ${trimmed}`);
				} else {
					vscode.window.showWarningMessage(`Command not found or failed: ${trimmed}`);
				}
				return;
			}

			// Otherwise, show alternatives if present
			if (altCommands && altCommands.length > 0) {
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
			}


			// CENTRALIZED INTENT OVERRIDE: If intent or command matches, always show Command History sidebar and return
			const intentStr = parsed?.intent?.toLowerCase() || '';
			const commandStr = parsed?.command?.toLowerCase() || '';
			vscode.window.showInformationMessage(`[NLC DEBUG] Actual intent string: ${intentStr}`);
			if (
				/(command history|history sidebar|show command history|see command history|open command history|nlc history|natural language command history|timeline|file history|history|command log|command timeline)/i.test(intentStr) ||
				/(command history|history sidebar|show command history|see command history|open command history|nlc history|natural language command history|timeline|file history|history|command log|command timeline)/i.test(commandStr)
			) {
				vscode.window.showInformationMessage('[NLC OVERRIDE] Intent or command matched: Opening Command History Sidebar (commandHistory.focus)');
				await vscode.commands.executeCommand('commandHistory.focus');
				return; // Do not process any further commands, even if LLM.command is set
			} else {
				vscode.window.showInformationMessage('[NLC DEBUG] Intent/command did not match command history sidebar.');
			}

			// Fallback: try to map sidebar/activity bar requests
			const mapped = mapSidebarCommand(userInput);
			if (mapped) {
				vscode.window.showInformationMessage(`[NLC FALLBACK] Sidebar fallback triggered: ${mapped}`);
				await vscode.commands.executeCommand(mapped);
				vscode.window.showInformationMessage(`[NLC FALLBACK] Executed VS Code command (sidebar fallback): ${mapped}`);
				return;
			} else {
				vscode.window.showInformationMessage('[NLC FALLBACK] Sidebar fallback not triggered. No mapping found.');
			}
		}
		catch (err: any) {
			vscode.window.showErrorMessage(`OpenAI API error: ${err.message || err}`);
		}
	});
	context.subscriptions.push(disposable);

	// Register the new command for direct input (no history QuickPick)
	const newDisposable = vscode.commands.registerCommand('natural-language-commands.new', async () => {
		let history: string[] = context.globalState.get<string[]>(HISTORY_KEY) || [];
		const userInput = await vscode.window.showInputBox({
			prompt: 'Enter a command in natural language (e.g., "Open the terminal and run my tests")',
			placeHolder: 'Describe what you want to do...'
		});
		if (!userInput || userInput.trim().length === 0) {
			vscode.window.showInformationMessage('No command entered.');
			return;
		}
		// Update history: add to top, remove duplicates, trim to limit
		history = [userInput, ...history.filter(cmd => cmd !== userInput)].slice(0, HISTORY_LIMIT);
		await context.globalState.update(HISTORY_KEY, history);
		// Add to session sidebar history
		commandHistoryProvider.addCommand({
			label: userInput,
			time: new Date(),
			parameters: '' // You can enhance this to capture parameters if needed
		});

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

			// If parsed.command is present, execute it directly
			if (parsed.command && typeof parsed.command === 'string' && parsed.command.trim().length > 0) {
				const trimmed = parsed.command.trim();
				vscode.window.showInformationMessage(`Executing command: ${trimmed}`);
				const result = await vscode.commands.executeCommand(trimmed);
				if (result !== undefined) {
					vscode.window.showInformationMessage(`Command executed successfully: ${trimmed}`);
				} else {
					vscode.window.showWarningMessage(`Command not found or failed: ${trimmed}`);
				}
				return;
			}

			// Otherwise, show alternatives if present
			if (altCommands && altCommands.length > 0) {
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
			}

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
		catch (err: any) {
			vscode.window.showErrorMessage(`OpenAI API error: ${err.message || err}`);
		}
	});
	context.subscriptions.push(newDisposable);
}






