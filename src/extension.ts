	// ...existing code...
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
	// Helper: Detect project type in the workspace or current folder
	async function detectProjectType(): Promise<'dotnet' | 'node' | 'unknown'> {
		const folders = vscode.workspace.workspaceFolders;
		if (!folders || folders.length === 0) {
			return 'unknown';
		}
		const folder = folders[0].uri.fsPath;
		const fs = require('fs');
		// Check for .csproj or .sln (dotnet)
		const dotnetFiles = fs.readdirSync(folder).filter((f: string) => f.endsWith('.csproj') || f.endsWith('.sln'));
		if (dotnetFiles.length > 0) {
			return 'dotnet';
		}
		// Check for package.json (node)
		if (fs.existsSync(require('path').join(folder, 'package.json'))) {
			return 'node';
		}
		return 'unknown';
	}
	// Helper: Remove leading 'please' (case-insensitive, with optional comma/space) from user input for history
	function stripPleasePrefix(text: string): string {
		return text.replace(/^\s*please\s*[,:]?\s*/i, '');
	}

	// Simulated Debug menu
	context.subscriptions.push(
		vscode.commands.registerCommand('natural-language-commands.debugMenu', async () => {
			vscode.window.showWarningMessage('Opening the native Debug menu is not supported by VS Code extensions. Here are common debug actions you can use instead.');
			const actions = [
				{ label: 'Start Debugging', command: 'workbench.action.debug.start' },
				{ label: 'Stop Debugging', command: 'workbench.action.debug.stop' },
				{ label: 'Restart Debugging', command: 'workbench.action.debug.restart' },
				{ label: 'Step Over', command: 'workbench.action.debug.stepOver' },
				{ label: 'Step Into', command: 'workbench.action.debug.stepInto' },
				{ label: 'Step Out', command: 'workbench.action.debug.stepOut' },
				{ label: 'Continue', command: 'workbench.action.debug.continue' },
				{ label: 'Pause', command: 'workbench.action.debug.pause' },
				{ label: 'Toggle Breakpoint', command: 'editor.debug.action.toggleBreakpoint' },
				{ label: 'Open Breakpoints View', command: 'workbench.debug.action.focusBreakpointsView' },
				{ label: 'Open Debug Console', command: 'workbench.debug.action.toggleRepl' },
			];
			const pick = await vscode.window.showQuickPick(actions, { placeHolder: 'Select a debug action to run:', canPickMany: false });
			if (pick && pick.command) {
				vscode.commands.executeCommand(pick.command);
			}
		})
	);
	// Helper: Translate Unix-style commands to PowerShell equivalents
	function translateToPowerShell(cmd: string): string {
		// Only basic translation for common commands
		const trimmed = cmd.trim();
		// ls -la, ls -l, ls -a, etc. → ls
		if (/^ls(\s+-[a-zA-Z]+)?\s*$/i.test(trimmed)) {
			return 'ls';
		}
		// ls -d */ or ls -d .*/ (list only directories)
		if (/^ls\s+-d\s+\*\/?$/i.test(trimmed) || /^ls\s+-d\s+\.\*\/?$/i.test(trimmed)) {
			return 'ls -Directory';
		}
		// ls --directory or ls --dir
		if (/^ls\s+--?d(irectory)?\s*$/i.test(trimmed)) {
			return 'ls -Directory';
		}
		// ls -Directory (already correct)
		if (/^ls\s+-Directory\s*$/i.test(trimmed)) {
			return trimmed;
		}
		// cat file.txt → Get-Content file.txt
		if (/^cat\s+(.+)/i.test(trimmed)) {
			return trimmed.replace(/^cat\s+(.+)/i, 'Get-Content $1');
		}
		// touch file.txt → New-Item file.txt -ItemType File
		if (/^touch\s+(.+)/i.test(trimmed)) {
			return trimmed.replace(/^touch\s+(.+)/i, 'New-Item $1 -ItemType File');
		}
		// rm file.txt → Remove-Item file.txt
		if (/^rm\s+(.+)/i.test(trimmed)) {
			return trimmed.replace(/^rm\s+(.+)/i, 'Remove-Item $1');
		}
		// mv src dest → Move-Item src dest
		if (/^mv\s+([^\s]+)\s+(.+)/i.test(trimmed)) {
			return trimmed.replace(/^mv\s+([^\s]+)\s+(.+)/i, 'Move-Item $1 $2');
		}
		// cp src dest → Copy-Item src dest
		if (/^cp\s+([^\s]+)\s+(.+)/i.test(trimmed)) {
			return trimmed.replace(/^cp\s+([^\s]+)\s+(.+)/i, 'Copy-Item $1 $2');
		}
		// grep pattern file → Select-String -Pattern pattern -Path file
		if (/^grep\s+([^\s]+)\s+(.+)/i.test(trimmed)) {
			return trimmed.replace(/^grep\s+([^\s]+)\s+(.+)/i, 'Select-String -Pattern $1 -Path $2');
		}
		// Default: return as-is
		return trimmed;
	}
		// Command: List all tables in VoiceLauncher database
		context.subscriptions.push(
			vscode.commands.registerCommand('natural-language-commands.listTablesVoiceLauncher', async (dbName?: string) => {
				// 1. Open a new untitled SQL file
				const doc = await vscode.workspace.openTextDocument({ language: 'sql', content: '' });
				await vscode.window.showTextDocument(doc);

				// 2. Trigger MSSQL connect command (user must select the database if not already connected)
				await vscode.commands.executeCommand('mssql.connect');

				// 3. Insert the query to list all tables for the specified database
				const editor = vscode.window.activeTextEditor;
				if (editor) {
					let useDb = dbName ? `USE [${dbName}];\n` : '';
					const query = `${useDb}SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE';\n`;
					await editor.edit(editBuilder => {
						editBuilder.insert(new vscode.Position(0, 0), query);
					});
				}

				// 4. Optionally, trigger query execution (user must confirm connection if not already connected)
				setTimeout(() => {
					vscode.commands.executeCommand('mssql.executeQuery');
				}, 1000);
			})
		);
	// Simulated Edit menu
	context.subscriptions.push(
		vscode.commands.registerCommand('nlc.editMenu', async () => {
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
		vscode.commands.registerCommand('nlc.selMenu', async () => {
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
		vscode.commands.registerCommand('nlc.viewMenu', async () => {
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
		vscode.commands.registerCommand('nlc.goMenu', async () => {
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
		vscode.commands.registerCommand('nlc.runMenu', async () => {
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
		vscode.commands.registerCommand('nlc.helpMenu', async () => {
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
		vscode.commands.registerCommand('nlc.showSidebars', async () => {
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
		vscode.commands.registerCommand('nlc.termMenu', async () => {
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
		vscode.commands.registerCommand('nlc.fileMenu', async () => {
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
		// Helper: Try to send Ctrl+C to the terminal using VS Code API
		async function trySendCtrlC() {
			try {
				// VS Code API for sending key sequences (since 1.64)
				await vscode.commands.executeCommand('workbench.action.terminal.sendSequence', { text: '\u0003' });
				vscode.window.showInformationMessage('Sent Ctrl+C to the terminal to interrupt the running process.');
			} catch (e) {
				vscode.window.showWarningMessage('Could not programmatically send Ctrl+C. Please manually stop the process in the terminal.');
			}
		}
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
	// Remove leading 'please' (case-insensitive, with optional comma/space) from user input for history
	function stripPleasePrefix(text: string): string {
		return text.replace(/^\s*please\s*[,:]?\s*/i, '');
	}
	const trimmedInput = stripPleasePrefix(userInput.trim());
	history = [trimmedInput, ...history.filter(cmd => cmd !== trimmedInput)].slice(0, HISTORY_LIMIT);
	await context.globalState.update(HISTORY_KEY, history);
	// Add to session sidebar history
	commandHistoryProvider.addCommand({
		label: trimmedInput,
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
			// Debugging menu trigger by intent or command
			if (parsed && (/(debugging commands|show debugging commands|debug menu|show debug menu|debugging actions|debug actions)/i.test(userInput) || /(debugging commands|debug menu)/i.test(parsed.intent || '') || /(debugging commands|debug menu)/i.test(parsed.command || ''))) {
				await vscode.commands.executeCommand('natural-language-commands.debugMenu');
				return;
			}
			// LLM semantic override: If isCommandHistorySidebar is true, always open sidebar and return
			if (parsed && parsed.isCommandHistorySidebar) {
				vscode.window.showInformationMessage('[NLC LLM SEMANTIC OVERRIDE] LLM flagged isCommandHistorySidebar: Opening Command History Sidebar (commandHistory.focus)');
				await vscode.commands.executeCommand('commandHistory.focus');
				return;
			}

			// Check intent for any "list all tables" workflow intent
			if (parsed && parsed.intent && typeof parsed.intent === 'string') {
				const intentStr = parsed.intent.trim().toLowerCase();
				if (/list (all )?tables/.test(intentStr) || /show (me )?(all )?tables/.test(intentStr)) {
					// Try to extract database name from user input
					let dbName = '';
					if (userInput && /voice ?launcher/i.test(userInput)) {
						dbName = 'VoiceLauncher';
					} else {
						// Prompt user for database name
						dbName = await vscode.window.showInputBox({
							prompt: 'Which database do you want to list tables for?',
							placeHolder: 'Enter database name (e.g., VoiceLauncher)'
						}) || '';
						if (!dbName) {
							vscode.window.showWarningMessage('No database specified. Aborting table listing.');
							return;
						}
					}
					vscode.window.showInformationMessage(`Triggering table listing workflow for database: ${dbName}`);
					await vscode.commands.executeCommand('natural-language-commands.listTablesVoiceLauncher', dbName);
					return;
				}
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
				// Custom mapping for VoiceLauncher table listing intent
				if (/list (all )?tables( available)? in (my )?(voice ?launcher|voicelauncher)/i.test(trimmed) ||
					/show (me )?(all )?tables( in)? (my )?(voice ?launcher|voicelauncher)/i.test(trimmed)) {
					vscode.window.showInformationMessage('Triggering VoiceLauncher table listing workflow...');
					await vscode.commands.executeCommand('natural-language-commands.listTablesVoiceLauncher');
					return;
				}
				vscode.window.showInformationMessage(`Executing command: ${trimmed}`);
				const result = await vscode.commands.executeCommand(trimmed);
				if (result !== undefined) {
					vscode.window.showInformationMessage(`Command executed successfully: ${trimmed}`);
				} else {
					vscode.window.showWarningMessage(`Command not found or failed: ${trimmed}`);
				}
				return;
			}

			// If parsed.terminal is present, run it in the integrated terminal
			if (parsed.terminal && typeof parsed.terminal === 'string' && parsed.terminal.trim().length > 0) {
				let terminalCommand = parsed.terminal.trim();
				// If the user wants to cancel/stop/interrupt a running process, try to send Ctrl+C
				if (/^(ctrl\+c|cancel|stop|interrupt|terminate|kill|shut ?down|abort|break)( running)?( command| process| task| job| terminal)?/i.test(terminalCommand)) {
					await trySendCtrlC();
					return;
				}
				// Detect build-and-run intent in user input or LLM output
				const buildRunIntent = /((build|compile)( and)? run|run( and)? build|build then run|build & run|run & build|run application|run the app|build the app|build application|start application|start the app)/i;
				if (buildRunIntent.test(userInput) || buildRunIntent.test(terminalCommand)) {
					const projectType = await detectProjectType();
					if (projectType === 'dotnet') {
						terminalCommand = 'dotnet build && dotnet run';
					} else if (projectType === 'node') {
						terminalCommand = 'npm run build && npm start';
					}
				} else if (/^(build|run|test)( the)?( app| application)?$/i.test(terminalCommand)) {
					// If the command is generic (e.g., 'build the application'), try to pick the right build command
					const projectType = await detectProjectType();
					if (projectType === 'dotnet') {
						terminalCommand = 'dotnet build';
					} else if (projectType === 'node') {
						terminalCommand = 'npm run build';
					}
				}
				// Translate if running in PowerShell
				if (vscode.env.shell && vscode.env.shell.toLowerCase().includes('pwsh')) {
					terminalCommand = translateToPowerShell(terminalCommand);
				}
				let terminal = vscode.window.activeTerminal;
				if (!terminal) {
					terminal = vscode.window.createTerminal('NLC Terminal');
				}
				terminal.show();
				terminal.sendText(terminalCommand, true);
				vscode.window.showInformationMessage(`Running in terminal: ${terminalCommand}`);
				return;
			}

			// Check alternatives for VoiceLauncher SQL workflow intent and terminal commands
			if (altCommands && altCommands.length > 0) {
				for (const alt of altCommands) {
					if (alt.command && typeof alt.command === 'string') {
						const altCmd = alt.command.trim();
						if (/list (all )?tables( available)? in (my )?(voice ?launcher|voicelauncher)/i.test(altCmd) ||
							/show (me )?(all )?tables( in)? (my )?(voice ?launcher|voicelauncher)/i.test(altCmd)) {
							vscode.window.showInformationMessage('Triggering VoiceLauncher table listing workflow (from alternative)...');
							await vscode.commands.executeCommand('natural-language-commands.listTablesVoiceLauncher');
							return;
						}
					}
					// If alternative has a terminal command, run it
					if (alt.terminal && typeof alt.terminal === 'string' && alt.terminal.trim().length > 0) {
						let terminalCommand = alt.terminal.trim();
						if (vscode.env.shell && vscode.env.shell.toLowerCase().includes('pwsh')) {
							terminalCommand = translateToPowerShell(terminalCommand);
						}
						let terminal = vscode.window.activeTerminal;
						if (!terminal) {
							terminal = vscode.window.createTerminal('NLC Terminal');
						}
						terminal.show();
						terminal.sendText(terminalCommand, true);
						vscode.window.showInformationMessage(`Running in terminal: ${terminalCommand}`);
						return;
					}
				}
			}

			// Otherwise, show alternatives if present
						if (altCommands && altCommands.length > 0) {
							type AltCommand = { command?: string; terminal?: string; description?: string };
							type NumberedPick = { label: string; alt: AltCommand; idx: number };
							const numbered: NumberedPick[] = altCommands.map((alt: any, idx: number) => {
								// Normalize nulls to undefined for type compatibility
								const normalized: AltCommand = {
									command: alt.command ?? undefined,
									terminal: alt.terminal ?? undefined,
									description: alt.description
								};
								let label = `${idx + 1}. `;
								if (normalized.command) { label += `Command: ${normalized.command}`; }
								if (normalized.terminal) { label += ` Terminal: ${normalized.terminal}`; }
								if (normalized.description) { label += ` — ${normalized.description}`; }
								return { label, alt: normalized, idx };
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
									return;
								} else if (selected.terminal && selected.terminal.trim().length > 0) {
									let trimmed = selected.terminal.trim();
									if (vscode.env.shell && vscode.env.shell.toLowerCase().includes('pwsh')) {
										trimmed = translateToPowerShell(trimmed);
									}
									let terminal = vscode.window.activeTerminal;
									if (!terminal) {
										terminal = vscode.window.createTerminal('NLC Terminal');
									}
									terminal.show();
									terminal.sendText(trimmed, true);
									vscode.window.showInformationMessage(`Running in terminal: ${trimmed}`);
									return;
								}
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
		// Remove leading 'please' (case-insensitive, with optional comma/space) from user input for history
		const trimmedInput = stripPleasePrefix(userInput.trim());
		history = [trimmedInput, ...history.filter(cmd => cmd !== trimmedInput)].slice(0, HISTORY_LIMIT);
		await context.globalState.update(HISTORY_KEY, history);
		// Add to session sidebar history
		commandHistoryProvider.addCommand({
			label: trimmedInput,
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
			// Debugging menu trigger by intent or command
			if (parsed && (/(debugging commands|show debugging commands|debug menu|show debug menu|debugging actions|debug actions)/i.test(userInput) || /(debugging commands|debug menu)/i.test(parsed.intent || '') || /(debugging commands|debug menu)/i.test(parsed.command || ''))) {
				await vscode.commands.executeCommand('natural-language-commands.debugMenu');
				return;
			}
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

			// If parsed.terminal is present, run it in the integrated terminal
			if (parsed.terminal && typeof parsed.terminal === 'string' && parsed.terminal.trim().length > 0) {
				let terminalCommand = parsed.terminal.trim();
				if (vscode.env.shell && vscode.env.shell.toLowerCase().includes('pwsh')) {
					terminalCommand = translateToPowerShell(terminalCommand);
				}
				let terminal = vscode.window.activeTerminal;
				if (!terminal) {
					terminal = vscode.window.createTerminal('NLC Terminal');
				}
				terminal.show();
				terminal.sendText(terminalCommand, true);
				vscode.window.showInformationMessage(`Running in terminal: ${terminalCommand}`);
				return;
			}

			// Otherwise, show alternatives if present
			if (altCommands && altCommands.length > 0) {
				type AltCommand = { command?: string; terminal?: string; description?: string };
				type NumberedPick = { label: string; alt: AltCommand; idx: number };
				const numbered: NumberedPick[] = altCommands.map((alt: any, idx: number) => {
					// Normalize nulls to undefined for type compatibility
					const normalized: AltCommand = {
						command: alt.command ?? undefined,
						terminal: alt.terminal ?? undefined,
						description: alt.description
					};
					let label = `${idx + 1}. `;
					if (normalized.command) { label += `Command: ${normalized.command}`; }
					if (normalized.terminal) { label += ` Terminal: ${normalized.terminal}`; }
					if (normalized.description) { label += ` — ${normalized.description}`; }
					return { label, alt: normalized, idx };
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
						return;
					} else if (selected.terminal && selected.terminal.trim().length > 0) {
						const trimmed = selected.terminal.trim();
						let terminal = vscode.window.activeTerminal;
						if (!terminal) {
							terminal = vscode.window.createTerminal('NLC Terminal');
						}
						terminal.show();
						terminal.sendText(trimmed, true);
						vscode.window.showInformationMessage(`Running in terminal: ${trimmed}`);
						return;
					}
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






