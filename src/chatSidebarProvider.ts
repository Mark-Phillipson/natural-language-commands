import * as vscode from 'vscode';

export class ChatSidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'nlcChatView';
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

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
                if (message.type === 'userMessage') {
                    this._sendMessageToWebview('addMessage', { role: 'user', content: message.text });
                    // LLM integration: call getLLMResult and display response
                    try {
                        // Dynamically import getLLMResult to avoid circular deps
                        const { getLLMResult } = await import('./llm.js');
                        // Get API key from env (same as extension.ts)
                        const apiKey = process.env.OPENAI_API_KEY;
                        if (!apiKey) {
                            this._sendMessageToWebview('addMessage', { role: 'assistant', content: '❌ OpenAI API key not found. Please set OPENAI_API_KEY in your .env file.' });
                            return;
                        }
                        // Use default model (gpt-4o)
                        const model = 'gpt-4o';
                        const llmResult = await getLLMResult(apiKey, message.text, model);
                        if (llmResult.error) {
                            this._sendMessageToWebview('addMessage', { role: 'assistant', content: '❌ LLM error: ' + llmResult.error });
                        } else {
                            // Show the LLM's intent/clarification as the assistant message
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
                            // Decision logic: execute if confidence >= 90% and command/terminal present
                            const confidence = llmResult.confidence || 0;
                            const hasCommand = !!llmResult.command;
                            const hasTerminal = !!llmResult.terminal;
                            if ((hasCommand || hasTerminal) && confidence >= 0.9) {
                                // Execute the command or terminal
                                if (hasCommand) {
                                    // VS Code command
                                    vscode.commands.executeCommand(llmResult.command!);
                                    reply += `\n✅ Executed VS Code command: ${llmResult.command}`;
                                } else if (hasTerminal) {
                                    // Terminal command
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
                                // Ask for clarification
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
    <div style="background:lime;color:black;padding:16px;text-align:center;font-size:20px;font-weight:bold;border:3px solid orange;">✅ SIDEBAR CHAT (${new Date().toLocaleTimeString()})</div>
    <div id="debug-log" style="background:black;color:lime;padding:4px;font-size:12px;"></div>
    <div id="chat-container" style="flex:1;overflow-y:auto;padding:20px;max-height:60vh;display:flex;flex-direction:column;"></div>
    <div style="padding:16px;border-top:2px solid #444;display:flex;gap:8px;background:#2d2d2d;align-items:center;">
        <label for="user-input" style="color:#aaa;font-size:13px;margin-right:6px;">Chat <span style="color:#0e639c;font-weight:bold;">(Alt+C)</span></label>
        <input type="text" id="user-input" accesskey="c" placeholder="Type your command here..." style="flex:1;padding:10px;background:#3c3c3c;color:white;border:1px solid #555;font-size:14px;" />
    <button id="send-button" accesskey="d" style="padding:10px 24px;background:#0e639c;color:white;border:none;cursor:pointer;font-size:14px;font-weight:bold;">Send <span style="font-size:12px;color:#fff;background:#0057b7;border-radius:3px;padding:2px 6px;margin-left:4px;">Alt+D</span></button>
    </div>
    <script nonce="${nonce}">
    document.addEventListener('DOMContentLoaded', function() {
        try {
            document.getElementById('debug-log').textContent = 'Sidebar script running at ' + new Date().toLocaleTimeString();
            const vscode = acquireVsCodeApi();
            const chatContainer = document.getElementById('chat-container');
            const userInput = document.getElementById('user-input');
            const sendButton = document.getElementById('send-button');
            if (!chatContainer || !userInput || !sendButton) {
                console.error('Sidebar chat: One or more DOM elements not found:', { chatContainer, userInput, sendButton });
                document.getElementById('debug-log').textContent += ' [ERROR: DOM elements missing]';
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
                vscode.postMessage({ type: 'userMessage', text });
                userInput.value = '';
            }
            sendButton.onclick = sendMessage;
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
            // Also support focusing input with Alt+C and sending with Alt+D
            document.addEventListener('keydown', (e) => {
                if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                    if (e.code === 'KeyC') {
                        userInput.focus();
                        e.preventDefault();
                    } else if (e.code === 'KeyD') {
                        sendButton.click();
                        e.preventDefault();
                    }
                }
            });
            focusInput();
        } catch (err) {
            console.error('Sidebar chat script error:', err);
            document.getElementById('debug-log').textContent += ' [ERROR: ' + err + ']';
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
