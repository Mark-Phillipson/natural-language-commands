import * as vscode from 'vscode';
import { detectProjectType, getTestCommandForProject, getBuildCommandForProject } from './projectTypeUtils';

export class ChatSidebarProvider implements vscode.WebviewViewProvider {
    private pendingConfirmation: null | {
        type: 'command' | 'terminal',
        value: string,
        replyPrefix: string
    } = null;
    public static readonly viewType = 'nlcChatView';
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    // Shared menu simulation definitions
    private static readonly menuSimulations: { [key: string]: { label: string, command: string }[] } = {
            'file': [
                { label: 'New File', command: 'explorer.newFile' },
                { label: 'Open File...', command: 'workbench.action.files.openFile' },
                { label: 'Open Folder...', command: 'workbench.action.files.openFolder' },
                { label: 'Save', command: 'workbench.action.files.save' },
                { label: 'Save As...', command: 'workbench.action.files.saveAs' },
                { label: 'Save All', command: 'workbench.action.files.saveAll' },
                { label: 'Close Editor', command: 'workbench.action.closeActiveEditor' },
                { label: 'Close Folder', command: 'workbench.action.closeFolder' },
                { label: 'Reopen Closed Editor', command: 'workbench.action.reopenClosedEditor' },
            ],
            'edit': [
                { label: 'Undo', command: 'undo' },
                { label: 'Redo', command: 'redo' },
                { label: 'Cut', command: 'editor.action.clipboardCutAction' },
                { label: 'Copy', command: 'editor.action.clipboardCopyAction' },
                { label: 'Paste', command: 'editor.action.clipboardPasteAction' },
                { label: 'Find', command: 'actions.find' },
                { label: 'Replace', command: 'editor.action.startFindReplaceAction' },
                { label: 'Select All', command: 'editor.action.selectAll' },
            ],
            'selection': [
                { label: 'Expand Selection', command: 'editor.action.smartSelect.expand' },
                { label: 'Shrink Selection', command: 'editor.action.smartSelect.shrink' },
                { label: 'Copy Line Up', command: 'editor.action.copyLinesUpAction' },
                { label: 'Copy Line Down', command: 'editor.action.copyLinesDownAction' },
                { label: 'Move Line Up', command: 'editor.action.moveLinesUpAction' },
                { label: 'Move Line Down', command: 'editor.action.moveLinesDownAction' },
            ],
            'view': [
                { label: 'Command Palette', command: 'workbench.action.showCommands' },
                { label: 'Explorer', command: 'workbench.view.explorer' },
                { label: 'Search', command: 'workbench.view.search' },
                { label: 'Source Control', command: 'workbench.view.scm' },
                { label: 'Run & Debug', command: 'workbench.view.debug' },
                { label: 'Extensions', command: 'workbench.view.extensions' },
                { label: 'Problems', command: 'workbench.actions.view.problems' },
                { label: 'Output', command: 'workbench.action.output.toggleOutput' },
                { label: 'Terminal', command: 'workbench.action.terminal.toggleTerminal' },
            ],
            'go': [
                { label: 'Go to File...', command: 'workbench.action.quickOpen' },
                { label: 'Go to Symbol...', command: 'workbench.action.gotoSymbol' },
                { label: 'Go to Line...', command: 'workbench.action.gotoLine' },
                { label: 'Go Back', command: 'workbench.action.navigateBack' },
                { label: 'Go Forward', command: 'workbench.action.navigateForward' },
                { label: 'Go to Next Problem', command: 'editor.action.marker.next' },
                { label: 'Go to Previous Problem', command: 'editor.action.marker.prev' },
            ],
            'run': [
                { label: 'Start Debugging', command: 'workbench.action.debug.start' },
                { label: 'Run Without Debugging', command: 'workbench.action.debug.run' },
                { label: 'Stop Debugging', command: 'workbench.action.debug.stop' },
                { label: 'Restart Debugging', command: 'workbench.action.debug.restart' },
                { label: 'Run Task...', command: 'workbench.action.tasks.runTask' },
            ],
            'terminal': [
                { label: 'New Terminal', command: 'workbench.action.terminal.new' },
                { label: 'Split Terminal', command: 'workbench.action.terminal.split' },
                { label: 'Kill Terminal', command: 'workbench.action.terminal.kill' },
                { label: 'Run Task...', command: 'workbench.action.tasks.runTask' },
                { label: 'Configure Tasks...', command: 'workbench.action.tasks.configureTaskRunner' },
                { label: 'Show Terminal', command: 'workbench.action.terminal.toggleTerminal' },
                { label: 'Focus Next Terminal', command: 'workbench.action.terminal.focusNext' },
                { label: 'Focus Previous Terminal', command: 'workbench.action.terminal.focusPrevious' },
            ],
            'help': [
                { label: 'Welcome', command: 'workbench.action.showWelcomePage' },
                { label: 'Documentation', command: 'workbench.action.openDocumentationUrl' },
                { label: 'Release Notes', command: 'update.showCurrentReleaseNotes' },
                { label: 'Keyboard Shortcuts Reference', command: 'workbench.action.openGlobalKeybindings' },
                { label: 'Report Issue', command: 'workbench.action.openIssueReporter' },
                { label: 'About', command: 'workbench.action.showAboutDialog' },
            ],
        };

    /**
     * Shared robust menu matcher and simulator. Returns true if a menu was matched and simulated.
     */
    private trySimulateMenu(text: string): boolean {
        const menuSimulations = ChatSidebarProvider.menuSimulations;
        let normText = text.trim().toLowerCase().replace(/\s+/g, ' ');
        const menuNames = Object.keys(menuSimulations);
        for (const menu of menuNames) {
            // Regex: optional polite/filler, optional open/show, optional the, <menu> menu, optional polite/filler at end
            const menuRegex = new RegExp(`(?:please |openly |kindly |can you |could you |would you |just |hey |hi |hello )*` +
                `(?:open |show |display |launch )*` +
                `(?:the )*` +
                `${menu} menu` +
                `(?: please| now| for me|)?`, 'i');
            if (menuRegex.test(normText)) {
                const actions = menuSimulations[menu];
                this._sendMessageToWebview('addMessage', { role: 'assistant', content: `Simulating the ${menu.charAt(0).toUpperCase() + menu.slice(1)} menu. Please select an action from the menu above.` });
                vscode.window.showQuickPick(actions, { placeHolder: `Select a ${menu} action to run:`, canPickMany: false }).then(async pick => {
                    if (pick && pick.command) {
                        try {
                            await vscode.commands.executeCommand(pick.command);
                            this._sendMessageToWebview('addMessage', { role: 'assistant', content: `✅ Ran ${menu.charAt(0).toUpperCase() + menu.slice(1)} menu action: ${pick.label}` });
                        } catch (err) {
                            let msg = 'Unknown error';
                            if (err && typeof err === 'object' && 'message' in err) {
                                msg = (err as any).message;
                            } else if (typeof err === 'string') {
                                msg = err;
                            }
                            this._sendMessageToWebview('addMessage', { role: 'assistant', content: `❌ Failed to run ${menu.charAt(0).toUpperCase() + menu.slice(1)} menu action: ${pick.label}\nError: ${msg}` });
                        }
                    } else {
                        this._sendMessageToWebview('addMessage', { role: 'assistant', content: `No ${menu.charAt(0).toUpperCase() + menu.slice(1)} menu action selected.` });
                    }
                });
                return true;
            }
        }
        return false;
    }

    /**
     * Programmatically send a user message to the chat and trigger LLM response as if the user typed it.
     */
    public async sendUserMessageToChat(text: string) {
    // Do NOT add the user message here; it is now always added in onDidReceiveMessage

        // Check for pending confirmation
        if (this.pendingConfirmation) {
            const answer = text.trim().toLowerCase();
            if (answer === 'yes' || answer === 'y') {
                if (this.pendingConfirmation.type === 'command') {
                    // Focus the active text editor before executing the command
                    const activeEditor = vscode.window.activeTextEditor;
                    if (activeEditor) {
                        await vscode.window.showTextDocument(activeEditor.document, activeEditor.viewColumn);
                    }
                    await vscode.commands.executeCommand(this.pendingConfirmation.value);
                    this._sendMessageToWebview('addMessage', { role: 'assistant', content: `${this.pendingConfirmation.replyPrefix}\n✅ Confirmed and executed VS Code command: ${this.pendingConfirmation.value}` });
                } else if (this.pendingConfirmation.type === 'terminal') {
                    let terminal = vscode.window.activeTerminal;
                    if (!terminal) {
                        terminal = vscode.window.createTerminal('NLC Terminal');
                    }
                    terminal.show();
                    terminal.sendText(this.pendingConfirmation.value, true);
                    this._sendMessageToWebview('addMessage', { role: 'assistant', content: `${this.pendingConfirmation.replyPrefix}\n✅ Confirmed and executed terminal command: ${this.pendingConfirmation.value}` });
                }
                this.pendingConfirmation = null;
                return;
            } else if (answer === 'no' || answer === 'n') {
                this._sendMessageToWebview('addMessage', { role: 'assistant', content: `${this.pendingConfirmation.replyPrefix}\n❌ Command cancelled.` });
                this.pendingConfirmation = null;
                return;
            } else {
                this._sendMessageToWebview('addMessage', { role: 'assistant', content: `Please reply with "yes" or "no" to confirm or cancel the command.` });
                return;
            }
        }

        // Special case: trigger sidebar picker for 'show all sidebars' in chat
        if (/^show (all )?sidebars?\??$/i.test(text.trim())) {
            this._sendMessageToWebview('addMessage', { role: 'assistant', content: 'Opening the interactive sidebar picker...' });
            vscode.commands.executeCommand('nlc.showSidebars');
            return;
        }

        // Shared robust menu simulation
        if (this.trySimulateMenu(text)) {
            return;
        }

        if (!this._view) {
            // If the view is not yet resolved, log a warning and try to focus the chat sidebar
            console.warn('[NLC] ChatSidebarProvider: _view is not resolved. Attempting to focus chat sidebar.');
            await vscode.commands.executeCommand('workbench.action.focusView.nlcChatView');
            // Try again after focusing
            setTimeout(() => {
                if (!this._view) {
                    vscode.window.showWarningMessage('NLC chat sidebar is not open. Please open the chat sidebar to see responses.');
                }
            }, 500);
            return;
        }

        // Special case: respond to "what can I say" directly in chat
        if (/^what can i say\??$/i.test(text.trim())) {
            const exampleList = [
                'Show all sidebars',
                'Open the terminal and run my tests',
                'Show command history sidebar',
                'Find all TODO comments in the workspace',
                'Create a new file called notes.md',
                'Go to line 42',
                'Show me the problems panel',
                'Run the build task',
                'Search for "function" in the workspace',
            ];
            const message =
                `You can ask me to do almost anything you can do in VS Code!\n\n` +
                `Here are some examples:\n` +
                exampleList.map(e => `• ${e}`).join('\n') +
                `\n\n...and much more! There are too many possibilities to list them all. Just try describing what you want to do in your own words.`;
            this._sendMessageToWebview('addMessage', { role: 'assistant', content: message });
            return;
        }

        // LLM integration: call getLLMResult and display response (duplicate logic from onDidReceiveMessage)
        try {
            const { getLLMResult } = await import('./llm.js');
            let apiKey: string | undefined;
            if (vscode.extensions.getExtension('natural-language-commands')) {
                // Try to get from SecretStorage if available
                try {
                    const ext = vscode.extensions.getExtension('natural-language-commands');
                    if (ext && ext.isActive && ext.exports && ext.exports.context && ext.exports.context.secrets) {
                        apiKey = await ext.exports.context.secrets.get('OPENAI_API_KEY');
                    }
                } catch {}
            }
            if (!apiKey) {
                apiKey = process.env.OPENAI_API_KEY;
            }
            if (!apiKey) {
                this._sendMessageToWebview('addMessage', { role: 'assistant', content: '❌ OpenAI API key not found. Use the "Set OpenAI API Key" command or set OPENAI_API_KEY in your .env file.' });
                return;
            }
            const model = 'gpt-4o';
            const llmResult = await getLLMResult(apiKey, text, model);
            if (llmResult.error) {
                this._sendMessageToWebview('addMessage', { role: 'assistant', content: '❌ LLM error: ' + llmResult.error });
            } else {
                let reply = '';
                if (llmResult.intent) { reply += `Intent: ${llmResult.intent}\n`; }
                if (llmResult.command) { reply += `VS Code Command: ${llmResult.command}\n`; }
                if (llmResult.terminal) { reply += `Terminal Command: ${llmResult.terminal}\n`; }
                if (llmResult.search) { reply += `Search: ${llmResult.search}\n`; }
                if (llmResult.confidence !== undefined) { reply += `Confidence: ${Math.round(llmResult.confidence * 100)}%\n`; }
                if (llmResult.alternatives && llmResult.alternatives.length > 0) {
                    reply += `Alternatives:\n`;
                    llmResult.alternatives.forEach((alt: any, i: number) => {
                        reply += `  - ${alt.command || alt.terminal || 'N/A'}: ${alt.description || ''}\n`;
                    });
                }
                const confidence = llmResult.confidence || 0;
                const hasCommand = !!llmResult.command;
                const hasTerminal = !!llmResult.terminal;
                // Unify: If user asks to run tests, override with project type detection
                const testIntent = /(open( the)? terminal( and)? run( my)? tests?)|(run( my)? tests?)|(test( the)?( app| application)?)/i;
                if (testIntent.test(text) || (hasTerminal && testIntent.test(llmResult.terminal || ''))) {
                    // Open terminal and run correct test command
                    await vscode.commands.executeCommand('workbench.action.terminal.toggleTerminal');
                    await new Promise(res => setTimeout(res, 300));
                    const { command: testCmd, language } = await getTestCommandForProject();
                    let terminal = vscode.window.activeTerminal;
                    if (!terminal) {
                        terminal = vscode.window.createTerminal('NLC Terminal');
                    }
                    terminal.show();
                    terminal.sendText(testCmd, true);
                    reply += `\n✅ Detected project type: ${language}\nOpened terminal and ran: ${testCmd}`;
                    this._sendMessageToWebview('addMessage', { role: 'assistant', content: reply.trim() });
                    return;
                }
                // Use the same threshold logic as the main command handler
                const config = vscode.workspace.getConfiguration();
                const thresholds = config.get<{ autoAccept: number; confirm: number }>('naturalLanguageCommands.confidenceThresholds', { autoAccept: 0.9, confirm: 0.7 });
                const autoAccept = typeof thresholds.autoAccept === 'number' ? thresholds.autoAccept : 0.9;
                const confirm = typeof thresholds.confirm === 'number' ? thresholds.confirm : 0.7;

                // DEBUG: Log confidence and thresholds
                // (DEBUG removed)
                if ((hasCommand || hasTerminal) && typeof confidence === 'number') {
                    if (autoAccept < 1 && confidence >= autoAccept) {
                        // Only auto-execute if autoAccept is less than 1
                        if (hasCommand) {
                            vscode.commands.executeCommand(llmResult.command!);
                            reply += `\n✅ Auto-executed VS Code command: ${llmResult.command}`;
                        } else if (hasTerminal) {
                            let terminal = vscode.window.activeTerminal;
                            if (!terminal) {
                                terminal = vscode.window.createTerminal('NLC Terminal');
                            }
                            terminal.show();
                            terminal.sendText(llmResult.terminal!, true);
                            reply += `\n✅ Auto-executed terminal command: ${llmResult.terminal}`;
                        }
                        this._sendMessageToWebview('addMessage', { role: 'assistant', content: reply.trim() });
                    } else if (confidence >= confirm || autoAccept === 1) {
                        // If autoAccept is 1, always ask for confirmation, never auto-execute
                        // Ask for confirmation in chat ONLY, do not execute or send summary
                        let confirmMsg = '';
                        if (hasCommand) {
                            confirmMsg = `Do you want to run this command? (yes/no)\nVS Code Command: ${llmResult.command}\nConfidence: ${(confidence * 100).toFixed(1)}%`;
                            this.pendingConfirmation = { type: 'command', value: llmResult.command!, replyPrefix: reply.trim() };
                        } else if (hasTerminal) {
                            confirmMsg = `Do you want to run this terminal command? (yes/no)\nTerminal Command: ${llmResult.terminal}\nConfidence: ${(confidence * 100).toFixed(1)}%`;
                            this.pendingConfirmation = { type: 'terminal', value: llmResult.terminal!, replyPrefix: reply.trim() };
                        }
                        this._sendMessageToWebview('addMessage', { role: 'assistant', content: confirmMsg });
                        // Do NOT send the intent/command/percentage reply until confirmation is received
                        return;
                    } else {
                        reply += '\n🤖 I need a bit more detail or clarification before I can run a command. Please rephrase or provide more information.';
                        this._sendMessageToWebview('addMessage', { role: 'assistant', content: reply.trim() });
                    }
                } else {
                    this._sendMessageToWebview('addMessage', { role: 'assistant', content: `[NLC DEBUG] Taking fallback clarification branch.` });
                    reply += '\n🤖 I need a bit more detail or clarification before I can run a command. Please rephrase or provide more information.';
                    this._sendMessageToWebview('addMessage', { role: 'assistant', content: reply.trim() });
                }
            }
        } catch (err) {
            let msg = 'Unknown error';
            if (err && typeof err === 'object' && 'message' in err) {
                msg = (err as any).message;
            } else if (typeof err === 'string') {
                msg = err;
            }
            this._sendMessageToWebview('addMessage', { role: 'assistant', content: '❌ Error calling LLM: ' + msg });
        }
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(
            async message => {
                try {
                    // If a confirmation is pending, handle it and return (do NOT call LLM)
                    if (this.pendingConfirmation) {
                        await this.sendUserMessageToChat(message.text);
                        return;
                    }
                    // Otherwise, proceed with normal LLM flow
                    await this.sendUserMessageToChat(message.text);
                } catch (err) {
                    let msg = 'Unknown error';
                    if (err && typeof err === 'object' && 'message' in err) {
                        msg = (err as any).message;
                    } else if (typeof err === 'string') {
                        msg = err;
                    }
                    console.error('[NLC ERROR] Exception in onDidReceiveMessage:', err);
                }
                if (message.type === 'userMessage') {
                    // Do NOT send the user message to the webview; it is already shown immediately by the frontend.
                    // Special case: trigger sidebar picker for 'show all sidebars' in chat
                    if (/^show (all )?sidebars?\??$/i.test(message.text.trim())) {
                        this._sendMessageToWebview('addMessage', { role: 'assistant', content: 'Opening the interactive sidebar picker...' });
                        vscode.commands.executeCommand('nlc.showSidebars');
                        return;
                    }
                    if (/^what can i say\??$/i.test(message.text.trim())) {
                        const exampleList = [
                            'Show all sidebars',
                            'Open the terminal and run my tests',
                            'Show command history sidebar',
                            'Find all TODO comments in the workspace',
                            'Create a new file called notes.md',
                            'Go to line 42',
                            'Show me the problems panel',
                            'Run the build task',
                            'Search for "function" in the workspace',
                        ];
                        const messageText =
                            `You can ask me to do almost anything you can do in VS Code!\n\n` +
                            `Here are some examples:\n` +
                            exampleList.map(e => `• ${e}`).join('\n') +
                            `\n\n...and much more! There are too many possibilities to list them all. Just try describing what you want to do in your own words.`;
                        this._sendMessageToWebview('addMessage', { role: 'assistant', content: messageText });
                        return;
                    }
                    // Shared robust menu simulation
                    if (this.trySimulateMenu(message.text)) {
                        return;
                    }
                    // LLM integration: call getLLMResult and display response
                    try {
                        const { getLLMResult } = await import('./llm.js');
                        const apiKey = process.env.OPENAI_API_KEY;
                        if (!apiKey) {
                            this._sendMessageToWebview('addMessage', { role: 'assistant', content: '❌ OpenAI API key not found. Please set OPENAI_API_KEY in your .env file.' });
                            return;
                        }
                        const model = 'gpt-4o';
                        const llmResult = await getLLMResult(apiKey, message.text, model);
                        if (llmResult.error) {
                            this._sendMessageToWebview('addMessage', { role: 'assistant', content: '❌ LLM error: ' + llmResult.error });
                        } else {
                            let reply = '';
                            if (llmResult.intent) {
                                reply += `Intent: ${llmResult.intent}\n`;
                            }
                            if (llmResult.command) {
                                reply += `VS Code Command: ${llmResult.command}\n`;
                            }
                            if (llmResult.terminal) {
                                reply += `Terminal Command: ${llmResult.terminal}\n`;
                            }
                            if (llmResult.search) {
                                reply += `Search: ${llmResult.search}\n`;
                            }
                            if (llmResult.confidence !== undefined) {
                                reply += `Confidence: ${Math.round(llmResult.confidence * 100)}%\n`;
                            }
                            if (llmResult.alternatives && llmResult.alternatives.length > 0) {
                                reply += `Alternatives:\n`;
                                llmResult.alternatives.forEach((alt: any, i: number) => {
                                    reply += `  - ${alt.command || alt.terminal || 'N/A'}: ${alt.description || ''}\n`;
                                });
                            }
                            // Unify: If user asks to run tests, override with project type detection
                            const testIntent = /(open( the)? terminal( and)? run( my)? tests?)|(run( my)? tests?)|(test( the)?( app| application)?)/i;
                            const confidence = llmResult.confidence || 0;
                            const hasCommand = !!llmResult.command;
                            const hasTerminal = !!llmResult.terminal;
                            if (testIntent.test(message.text) || (hasTerminal && testIntent.test(llmResult.terminal || ''))) {
                                await vscode.commands.executeCommand('workbench.action.terminal.toggleTerminal');
                                await new Promise(res => setTimeout(res, 300));
                                const { command: testCmd, language } = await getTestCommandForProject();
                                let terminal = vscode.window.activeTerminal;
                                if (!terminal) {
                                    terminal = vscode.window.createTerminal('NLC Terminal');
                                }
                                terminal.show();
                                terminal.sendText(testCmd, true);
                                reply += `\n✅ Detected project type: ${language}\nOpened terminal and ran: ${testCmd}`;
                                this._sendMessageToWebview('addMessage', { role: 'assistant', content: reply.trim() });
                                return;
                            }
                            if ((hasCommand || hasTerminal) && confidence >= 0.9) {
                                if (hasCommand) {
                                    vscode.commands.executeCommand(llmResult.command!);
                                    reply += `\n✅ Executed VS Code command: ${llmResult.command}`;
                                } else if (hasTerminal) {
                                    let terminal = vscode.window.activeTerminal;
                                    if (!terminal) {
                                        terminal = vscode.window.createTerminal('NLC Terminal');
                                    }
                                    terminal.show();
                                    terminal.sendText(llmResult.terminal!, true);
                                    reply += `\n✅ Executed terminal command: ${llmResult.terminal}`;
                                }
                                this._sendMessageToWebview('addMessage', { role: 'assistant', content: reply.trim() });
                            } else {
                                reply += '\n🤖 I need a bit more detail or clarification before I can run a command. Please rephrase or provide more information.';
                                this._sendMessageToWebview('addMessage', { role: 'assistant', content: reply.trim() });
                            }
                        }
                    } catch (err) {
                        let msg = 'Unknown error';
                        if (err && typeof err === 'object' && 'message' in err) {
                            msg = (err as any).message;
                        } else if (typeof err === 'string') {
                            msg = err;
                        }
                        this._sendMessageToWebview('addMessage', { role: 'assistant', content: '❌ Error calling LLM: ' + msg });
                    }
                }
            }
        );
    }

    private _sendMessageToWebview(type: string, payload: any) {
        this._view?.webview.postMessage({ type, payload });
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const nonce = getNonce();
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>NLC Chat Sidebar</title>
</head>
<body style="margin:0;padding:0;display:flex;flex-direction:column;height:100vh;background:#1e1e1e;color:white;font-family:Arial,sans-serif;">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 20px 0 20px;background:#232323;border-bottom:1px solid #333;">
        <span style="font-size:1.1em;font-weight:bold;letter-spacing:0.5px;">NLC Chat</span>
        <button id="clear-chat-btn" title="Clear Chat (Alt+L)" accesskey="l" style="background:#2d2d2d;color:#fff;border:none;padding:6px 14px;border-radius:5px;cursor:pointer;font-size:13px;transition:background 0.2s;outline:none;">
            🧹 C<span style='text-decoration:underline'>l</span>ear Chat <span style="font-size:11px;opacity:0.7;">(Alt+L)</span>
        </button>
    </div>
    <div id="chat-container" style="flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;"></div>
    <div style="padding:16px;border-top:2px solid #444;display:flex;gap:8px;background:#2d2d2d;align-items:center;position:relative;z-index:1;">
        <input type="text" id="user-input" accesskey="c" placeholder="Type your command here... (Press Enter to send, Alt+C to focus)" title="Press Enter to send message" style="flex:1;padding:10px;background:#3c3c3c;color:white;border:1px solid #555;font-size:14px;" />
    </div>
    <script nonce="${nonce}">
    document.addEventListener('DOMContentLoaded', function() {
        try {
            const vscode = acquireVsCodeApi();
            const chatContainer = document.getElementById('chat-container');
            const userInput = document.getElementById('user-input');
            const clearBtn = document.getElementById('clear-chat-btn');
            if (!chatContainer || !userInput || !clearBtn) {
                console.error('Sidebar chat: One or more DOM elements not found:', { chatContainer, userInput, clearBtn });
                return;
            }
            function addMessage(role, content) {
                const msgDiv = document.createElement('div');
                msgDiv.style.cssText = 'margin-bottom:16px;padding:12px;border-left:4px solid;font-size:15px;line-height:1.5;white-space:pre-line;word-break:break-word;background:#232323;border-radius:6px;box-shadow:0 1px 4px #0002;';
                let label = '', color = '';
                if (role === 'user') { label = '👤 USER'; color = '#0057b7'; }
                else if (role === 'assistant') { label = '🤖 ASSISTANT'; color = '#228B22'; }
                else { label = '⚙️ SYSTEM'; color = '#ff9800'; }
                msgDiv.style.borderLeftColor = color;
                msgDiv.innerHTML = '<div style="font-weight:bold;margin-bottom:6px;color:' + color + '">' + label + '</div><div style="white-space:pre-line;">' + content + '</div>';
                chatContainer.appendChild(msgDiv);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
            function sendMessage() {
                const text = userInput.value.trim();
                if (!text) return;
                // Immediately show the user message in the chat for correct order
                addMessage('user', text);
                vscode.postMessage({ type: 'userMessage', text });
                userInput.value = '';
            }
            clearBtn.addEventListener('click', function() {
                chatContainer.innerHTML = '';
                userInput.focus();
            });
            userInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    sendMessage();
                    e.preventDefault();
                }
            });
            // Expose a global function for programmatic sending (e.g. from voice command)
            window.sendChatMessage = sendMessage;
            window.addEventListener('message', event => {
                const message = event.data;
                if (message.type === 'addMessage') {
                    addMessage(message.payload.role, message.payload.content);
                }
            });
            // Always focus input when the webview becomes visible
            function focusInput() {
                setTimeout(() => { userInput.focus(); }, 0);
            }
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) focusInput();
            });
            // Also support focusing input with Alt+C
            document.addEventListener('keydown', (e) => {
                if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                    if (e.code === 'KeyC') {
                        userInput.focus();
                        e.preventDefault();
                    }
                }
            });
            focusInput();
        } catch (err) {
            console.error('Sidebar chat script error:', err);
            // document.getElementById('debug-log').textContent += ' [ERROR: ' + err + ']';
        }
    });
    </script>
</body>
</html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
