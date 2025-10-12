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
            message => {
                if (message.type === 'userMessage') {
                    this._sendMessageToWebview('addMessage', { role: 'user', content: message.text });
                    this._sendMessageToWebview('addMessage', { role: 'assistant', content: 'Echo: ' + message.text });
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
    alert('Sidebar script loaded!\nLine 2: Chat webview is active.\nLine 3: Use Alt+C to focus input.\nLine 4: Use Alt+D to send.');
    document.getElementById('debug-log').textContent = 'Sidebar script running at ' + new Date().toLocaleTimeString();
    (function() {
        const vscode = acquireVsCodeApi();
        const chatContainer = document.getElementById('chat-container');
        const userInput = document.getElementById('user-input');
        const sendButton = document.getElementById('send-button');
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
            sendButton.disabled = true;
        }
        sendButton.onclick = sendMessage;
        userInput.onkeypress = function(e) { if (e.key === 'Enter') sendMessage(); };
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'addMessage') {
                addMessage(message.payload.role, message.payload.content);
                sendButton.disabled = false;
            }
        });
        // Always focus input when the webview becomes visible
        function focusInput() {
            setTimeout(() => { userInput.focus(); }, 0);
        }
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) focusInput();
        });
        // Also support focusing input with Alt+C and sending with Alt+S
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
    })();
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
