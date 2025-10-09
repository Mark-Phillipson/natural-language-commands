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
	// Simulated Edit menu
	context.subscriptions.push(
		vscode.commands.registerCommand('natural-language-commands.editMenu', async () => {
			vscode.window.showWarningMessage('Opening the native Edit menu is not supported by VS Code extensions. Here are common edit actions you can use instead.');
			const actions = [
				{ label: 'Undo', command: 'undo' },
				{ label: 'Redo', command: 'redo' },
				{ label: 'Cut', command: 'editor.action.clipboardCutAction' },
				{ label: 'Copy', command: 'editor.action.clipboardCopyAction' },
				{ label: 'Paste', command: 'editor.action.clipboardPasteAction' },
				{ label: 'Find', command: 'actions.find' },
				{ label: 'Replace', command: 'editor.action.startFindReplaceAction' },
				{ label: 'Select All', command: 'editor.action.selectAll' },
			];
			const pick = await vscode.window.showQuickPick(actions, { placeHolder: 'Select an edit action to run:', canPickMany: false });
			if (pick && pick.command) {
				vscode.commands.executeCommand(pick.command);
			}
		})
	);
	// Simulated Selection menu
	context.subscriptions.push(
		vscode.commands.registerCommand('natural-language-commands.selectionMenu', async () => {
			vscode.window.showWarningMessage('Opening the native Selection menu is not supported by VS Code extensions. Here are common selection actions you can use instead.');
			const actions = [
				{ label: 'Select All', command: 'editor.action.selectAll' },
				{ label: 'Expand Selection', command: 'editor.action.smartSelect.expand' },
				{ label: 'Shrink Selection', command: 'editor.action.smartSelect.shrink' },
				{ label: 'Copy Line Up', command: 'editor.action.copyLinesUpAction' },
				{ label: 'Copy Line Down', command: 'editor.action.copyLinesDownAction' },
				{ label: 'Move Line Up', command: 'editor.action.moveLinesUpAction' },
				{ label: 'Move Line Down', command: 'editor.action.moveLinesDownAction' },
			];
			const pick = await vscode.window.showQuickPick(actions, { placeHolder: 'Select a selection action to run:', canPickMany: false });
			if (pick && pick.command) {
				vscode.commands.executeCommand(pick.command);
			}
		})
	);
	// Simulated View menu
	context.subscriptions.push(
		vscode.commands.registerCommand('natural-language-commands.viewMenu', async () => {
			vscode.window.showWarningMessage('Opening the native View menu is not supported by VS Code extensions. Here are common view actions you can use instead.');
			const actions = [
				{ label: 'Command Palette', command: 'workbench.action.showCommands' },
				{ label: 'Explorer', command: 'workbench.view.explorer' },
				{ label: 'Search', command: 'workbench.view.search' },
				{ label: 'Source Control', command: 'workbench.view.scm' },
				{ label: 'Run & Debug', command: 'workbench.view.debug' },
				{ label: 'Extensions', command: 'workbench.view.extensions' },
				{ label: 'Problems', command: 'workbench.actions.view.problems' },
				{ label: 'Output', command: 'workbench.action.output.toggleOutput' },
				{ label: 'Terminal', command: 'workbench.action.terminal.toggleTerminal' },
			];
			const pick = await vscode.window.showQuickPick(actions, { placeHolder: 'Select a view action to run:', canPickMany: false });
			if (pick && pick.command) {
				vscode.commands.executeCommand(pick.command);
			}
		})
	);
	// Simulated Go menu
	context.subscriptions.push(
		vscode.commands.registerCommand('natural-language-commands.goMenu', async () => {
			vscode.window.showWarningMessage('Opening the native Go menu is not supported by VS Code extensions. Here are common go actions you can use instead.');
			const actions = [
				{ label: 'Go to File...', command: 'workbench.action.quickOpen' },
				{ label: 'Go to Symbol...', command: 'workbench.action.gotoSymbol' },
				{ label: 'Go to Line...', command: 'workbench.action.gotoLine' },
				{ label: 'Go Back', command: 'workbench.action.navigateBack' },
				{ label: 'Go Forward', command: 'workbench.action.navigateForward' },
				{ label: 'Go to Next Problem', command: 'editor.action.marker.next' },
				{ label: 'Go to Previous Problem', command: 'editor.action.marker.prev' },
			];
			const pick = await vscode.window.showQuickPick(actions, { placeHolder: 'Select a go action to run:', canPickMany: false });
			if (pick && pick.command) {
				vscode.commands.executeCommand(pick.command);
			}
		})
	);
	// Simulated Run menu
	context.subscriptions.push(
		vscode.commands.registerCommand('natural-language-commands.runMenu', async () => {
			vscode.window.showWarningMessage('Opening the native Run menu is not supported by VS Code extensions. Here are common run actions you can use instead.');
			const actions = [
				{ label: 'Start Debugging', command: 'workbench.action.debug.start' },
				{ label: 'Run Without Debugging', command: 'workbench.action.debug.run' },
				{ label: 'Stop Debugging', command: 'workbench.action.debug.stop' },
				{ label: 'Restart Debugging', command: 'workbench.action.debug.restart' },
				{ label: 'Run Task...', command: 'workbench.action.tasks.runTask' },
			];
			const pick = await vscode.window.showQuickPick(actions, { placeHolder: 'Select a run action to run:', canPickMany: false });
			if (pick && pick.command) {
				vscode.commands.executeCommand(pick.command);
			}
		})
	);
	// Simulated Help menu
	context.subscriptions.push(
		vscode.commands.registerCommand('natural-language-commands.helpMenu', async () => {
			vscode.window.showWarningMessage('Opening the native Help menu is not supported by VS Code extensions. Here are common help actions you can use instead.');
			const actions = [
				{ label: 'Welcome', command: 'workbench.action.showWelcomePage' },
				{ label: 'Documentation', command: 'workbench.action.openDocumentationUrl' },
				{ label: 'Release Notes', command: 'update.showCurrentReleaseNotes' },
				{ label: 'Keyboard Shortcuts Reference', command: 'workbench.action.openGlobalKeybindings' },
				{ label: 'Report Issue', command: 'workbench.action.openIssueReporter' },
				{ label: 'About', command: 'workbench.action.showAboutDialog' },
			];
			const pick = await vscode.window.showQuickPick(actions, { placeHolder: 'Select a help action to run:', canPickMany: false });
			if (pick && pick.command) {
				vscode.commands.executeCommand(pick.command);
			}
		})
	);
	// Register a command to show all sidebars and focus the selected one
	context.subscriptions.push(
		vscode.commands.registerCommand('natural-language-commands.showSidebars', async () => {
			// Add built-in and popular extension sidebars (e.g., Cursorless)
			const sidebars = [
				{ label: 'Explorer', command: 'workbench.view.explorer' },
				{ label: 'Source Control', command: 'workbench.view.scm' },
				{ label: 'Run & Debug', command: 'workbench.view.debug' },
				{ label: 'Extensions', command: 'workbench.view.extensions' },
				{ label: 'Remote Explorer', command: 'workbench.view.remote' },
				{ label: 'Testing', command: 'workbench.view.testing' },
				{ label: 'Outline', command: 'outline.focus' },
				{ label: 'Comments', command: 'workbench.panel.comments' },
				{ label: 'Timeline', command: 'timeline.focus' },
				{ label: 'Notebooks', command: 'notebook.focus' },
				{ label: 'Cursorless', command: 'workbench.view.extension.cursorless' },
				// Add more extension sidebars here as needed
			];
			// TODO: Optionally load user-custom sidebars from settings
			const pick = await vscode.window.showQuickPick(sidebars, {
				placeHolder: 'Select a sidebar to focus:',
				canPickMany: false
			});
			if (pick && pick.command) {
				vscode.commands.executeCommand(pick.command);
			}
		})
	);
	// Register a command to simulate the Terminal menu
	context.subscriptions.push(
		vscode.commands.registerCommand('natural-language-commands.terminalMenu', async () => {
			vscode.window.showWarningMessage(
				'Opening the native Terminal menu is not supported by VS Code extensions. Here are common terminal actions you can use instead.'
			);
			const actions = [
				{ label: 'New Terminal', command: 'workbench.action.terminal.new' },
				{ label: 'Split Terminal', command: 'workbench.action.terminal.split' },
				{ label: 'Kill Terminal', command: 'workbench.action.terminal.kill' },
				{ label: 'Run Task...', command: 'workbench.action.tasks.runTask' },
				{ label: 'Configure Tasks...', command: 'workbench.action.tasks.configureTaskRunner' },
				{ label: 'Show Terminal', command: 'workbench.action.terminal.toggleTerminal' },
				{ label: 'Focus Next Terminal', command: 'workbench.action.terminal.focusNext' },
				{ label: 'Focus Previous Terminal', command: 'workbench.action.terminal.focusPrevious' },
			];
			const pick = await vscode.window.showQuickPick(actions, {
				placeHolder: 'Select a terminal action to run:',
				canPickMany: false
			});
			if (pick && pick.command) {
				vscode.commands.executeCommand(pick.command);
			}
		})
	);
	// Register a command to simulate the File menu
	context.subscriptions.push(
		vscode.commands.registerCommand('natural-language-commands.fileMenu', async () => {
			vscode.window.showWarningMessage(
				'Opening the native File menu is not supported by VS Code extensions. Here are common file actions you can use instead.'
			);
			const actions = [
				{ label: 'New File', command: 'explorer.newFile' },
				{ label: 'Open File...', command: 'workbench.action.files.openFile' },
				{ label: 'Open Folder...', command: 'workbench.action.files.openFolder' },
				{ label: 'Save', command: 'workbench.action.files.save' },
				{ label: 'Save As...', command: 'workbench.action.files.saveAs' },
				{ label: 'Save All', command: 'workbench.action.files.saveAll' },
				{ label: 'Close Editor', command: 'workbench.action.closeActiveEditor' },
				{ label: 'Close Folder', command: 'workbench.action.closeFolder' },
				{ label: 'Revert File', command: 'workbench.action.files.revert' },
			];
			const pick = await vscode.window.showQuickPick(actions, {
				placeHolder: 'Select a file action to run:',
				canPickMany: false
			});
			if (pick && pick.command) {
				vscode.commands.executeCommand(pick.command);
			}
		})
	);
	// Register a command to show example natural language commands
	context.subscriptions.push(
		vscode.commands.registerCommand('natural-language-commands.examples', async () => {
			const examples = [
				'Open the terminal and run my tests',
				'Show the command history sidebar',
				'Open the explorer',
				'Show me my extensions',
				'Switch to the source control view',
				'Open settings in JSON view',
				'Create a new file called hello.txt',
				'Find all TODO comments in the workspace',
				'Show me the output panel',
				'Run the build task',
				'What is the current git branch?',
				'Show me the problems panel',
				'Open the debug console',
				'Show me the command palette',
				'Clear the command history',
			];
			await vscode.window.showQuickPick(examples, {
				placeHolder: 'Example natural language commands you can say:',
				canPickMany: false
			});
		})
	);
	// Set up command history provider for the sidebar
	const commandHistoryProvider = new CommandHistoryProvider();
	vscode.window.registerTreeDataProvider('commandHistoryView', commandHistoryProvider);
	// Register a second section for example commands
	const exampleCommandsProvider = new (require('./commandHistoryProvider').ExampleCommandsProvider)();
	vscode.window.registerTreeDataProvider('exampleCommandsView', exampleCommandsProvider);
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
		// Get history from globalState and trim all entries
		let history: string[] = (context.globalState.get<string[]>(HISTORY_KEY) || []).map(cmd => cmd.trim());
		// Prepare QuickPick items (all trimmed)
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
	// Update history: add to top, remove duplicates, trim to limit (all trimmed)
	const trimmedInput = userInput.trim();
	history = [trimmedInput, ...history.filter(cmd => cmd !== trimmedInput)].slice(0, HISTORY_LIMIT);
	await context.globalState.update(HISTORY_KEY, history);
		// Add to session sidebar history
		commandHistoryProvider.addCommand({
			label: userInput.trim(),
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
			label: userInput.trim(),
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






