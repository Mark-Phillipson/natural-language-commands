import * as vscode from 'vscode';
import { getLLMResult, LLMResult } from './llm';

interface ChatMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
	timestamp: Date;
	commandResult?: LLMResult;
}

interface FeedbackData {
	userInput: string;
	llmResult: LLMResult;
	wasCorrect: boolean;
	userFeedback?: string;
	timestamp: Date;
}

export class ChatPanel {
	public static currentPanel: ChatPanel | undefined;
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];
	private _conversationHistory: ChatMessage[] = [];
	private _feedbackHistory: FeedbackData[] = [];
	private _context: vscode.ExtensionContext;

	public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it
		if (ChatPanel.currentPanel) {
			ChatPanel.currentPanel._panel.reveal(column);
			return ChatPanel.currentPanel;
		}

		// Otherwise, create a new panel
		const panel = vscode.window.createWebviewPanel(
			'nlcChat',
			'Natural Language Commands Chat',
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [extensionUri]
			}
		);

		ChatPanel.currentPanel = new ChatPanel(panel, extensionUri, context);
		return ChatPanel.currentPanel;
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
		this._panel = panel;
		this._extensionUri = extensionUri;
		this._context = context;

		// Load existing feedback history from storage
		this._feedbackHistory = context.globalState.get<FeedbackData[]>('nlc.feedbackHistory', []);

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			async message => {
				switch (message.type) {
					case 'userMessage':
						await this._handleUserMessage(message.text);
						break;
					case 'executeCommand':
						await this._executeCommand(message.command, message.terminal);
						break;
					case 'provideFeedback':
						await this._storeFeedback(message.feedback);
						break;
					case 'refineCommand':
						await this._refineCommand(message.refinement);
						break;
				}
			},
			null,
			this._disposables
		);
	}

	private async _handleUserMessage(text: string) {
		// Add user message to conversation
		this._conversationHistory.push({
			role: 'user',
			content: text,
			timestamp: new Date()
		});

		// Update UI to show user message
		this._sendMessageToWebview('addMessage', { role: 'user', content: text });

		// Show "thinking" indicator
		this._sendMessageToWebview('setThinking', { thinking: true });

		try {
			const apiKey = process.env.OPENAI_API_KEY;
			if (!apiKey) {
				this._sendMessageToWebview('setThinking', { thinking: false });
				this._sendMessageToWebview('addMessage', {
					role: 'system',
					content: 'Error: OpenAI API key not found. Please set OPENAI_API_KEY in your .env file.'
				});
				return;
			}

			const config = vscode.workspace.getConfiguration();
			const model = config.get<string>('naturalLanguageCommands.model', 'gpt-4o');

			// Get LLM result
			const result = await getLLMResult(apiKey, text, model);

			// Add assistant response to conversation
			const assistantMessage: ChatMessage = {
				role: 'assistant',
				content: this._formatLLMResponse(result),
				timestamp: new Date(),
				commandResult: result
			};
			this._conversationHistory.push(assistantMessage);

			// Update UI
			this._sendMessageToWebview('setThinking', { thinking: false });
			this._sendMessageToWebview('addMessage', {
				role: 'assistant',
				content: assistantMessage.content,
				commandResult: result,
				showActions: true
			});

		} catch (error: any) {
			this._sendMessageToWebview('setThinking', { thinking: false });
			this._sendMessageToWebview('addMessage', {
				role: 'system',
				content: `Error: ${error.message || error}`
			});
		}
	}

	private _formatLLMResponse(result: LLMResult): string {
		let response = `**Intent**: ${result.intent}\n\n`;

		if (result.command) {
			response += `**VS Code Command**: \`${result.command}\`\n\n`;
		}

		if (result.terminal) {
			response += `**Terminal Command**: \`${result.terminal}\`\n\n`;
		}

		if (result.search) {
			response += `**Search Term**: \`${result.search}\`\n\n`;
		}

		response += `**Confidence**: ${(result.confidence * 100).toFixed(0)}%\n\n`;

		if (result.alternatives && result.alternatives.length > 0) {
			response += `**Alternatives**:\n`;
			result.alternatives.forEach((alt, idx) => {
				response += `${idx + 1}. `;
				if (alt.command) {
					response += `Command: \`${alt.command}\` `;
				}
				if (alt.terminal) {
					response += `Terminal: \`${alt.terminal}\` `;
				}
				if (alt.description) {
					response += `— ${alt.description}`;
				}
				response += '\n';
			});
		}

		return response;
	}

	private async _executeCommand(command: string | null, terminal: string | null) {
		try {
			// Get the last command result to check confidence
			const lastAssistantMsg = [...this._conversationHistory]
				.reverse()
				.find(msg => msg.role === 'assistant' && msg.commandResult);
			
			const confidence = lastAssistantMsg?.commandResult?.confidence || 0;
			const CONFIDENCE_THRESHOLD = 0.9;

			// Check confidence threshold
			if (confidence < CONFIDENCE_THRESHOLD) {
				const shouldExecute = await vscode.window.showWarningMessage(
					`I'm ${Math.round(confidence * 100)}% confident about this command.\n\nDo you want to proceed?`,
					{ modal: true },
					'Execute Anyway',
					'Cancel'
				);

				if (shouldExecute !== 'Execute Anyway') {
					this._sendMessageToWebview('addMessage', {
						role: 'system',
						content: '❌ Command execution cancelled due to low confidence.'
					});
					return;
				}
			}

			if (command && command.trim().length > 0) {
				const trimmed = command.trim();
				await vscode.commands.executeCommand(trimmed);
				this._sendMessageToWebview('addMessage', {
					role: 'system',
					content: `✅ Successfully executed command (${Math.round(confidence * 100)}% confidence): \`${trimmed}\``
				});
			} else if (terminal && terminal.trim().length > 0) {
				let terminalInstance = vscode.window.activeTerminal;
				if (!terminalInstance) {
					terminalInstance = vscode.window.createTerminal('NLC Terminal');
				}
				terminalInstance.show();
				terminalInstance.sendText(terminal.trim(), true);
				this._sendMessageToWebview('addMessage', {
					role: 'system',
					content: `✅ Running in terminal (${Math.round(confidence * 100)}% confidence): \`${terminal}\``
				});
			}
		} catch (error: any) {
			this._sendMessageToWebview('addMessage', {
				role: 'system',
				content: `❌ Error executing command: ${error.message || error}`
			});
		}
	}

	private async _storeFeedback(feedback: { wasCorrect: boolean; userFeedback?: string }) {
		// Get the last assistant message with command result
		const lastAssistantMsg = [...this._conversationHistory]
			.reverse()
			.find(msg => msg.role === 'assistant' && msg.commandResult);

		if (lastAssistantMsg && lastAssistantMsg.commandResult) {
			const lastUserMsg = [...this._conversationHistory]
				.reverse()
				.find(msg => msg.role === 'user');

			const feedbackData: FeedbackData = {
				userInput: lastUserMsg?.content || '',
				llmResult: lastAssistantMsg.commandResult,
				wasCorrect: feedback.wasCorrect,
				userFeedback: feedback.userFeedback,
				timestamp: new Date()
			};

			this._feedbackHistory.push(feedbackData);

			// Store in global state (limit to last 100 feedback items)
			const limitedHistory = this._feedbackHistory.slice(-100);
			await this._context.globalState.update('nlc.feedbackHistory', limitedHistory);

			this._sendMessageToWebview('addMessage', {
				role: 'system',
				content: feedback.wasCorrect
					? '✅ Thanks for the positive feedback!'
					: '❌ Thanks for the feedback. This will help improve future suggestions.'
			});
		}
	}

	private async _refineCommand(refinement: string) {
		// Treat refinement as a follow-up message with context
		const contextMessage = `Previous command didn't work as expected. User refinement: ${refinement}`;
		await this._handleUserMessage(contextMessage);
	}

	private _sendMessageToWebview(type: string, payload: any) {
		this._panel.webview.postMessage({ type, payload });
	}

	private _update() {
		const webview = this._panel.webview;
		this._panel.webview.html = this._getHtmlForWebview(webview);
	}

	private _getHtmlForWebview(webview: vscode.Webview): string {
		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Natural Language Commands Chat</title>
	<style>
		* {
			box-sizing: border-box;
			margin: 0;
			padding: 0;
		}
		body {
			font-family: var(--vscode-font-family);
			color: var(--vscode-foreground);
			background-color: var(--vscode-editor-background);
			display: flex;
			flex-direction: column;
			height: 100vh;
			overflow: hidden;
		}
		#chat-container {
			flex: 1;
			overflow-y: auto;
			padding: 16px;
			display: flex;
			flex-direction: column;
			gap: 12px;
		}
		.message {
			padding: 12px;
			border-radius: 8px;
			max-width: 85%;
			word-wrap: break-word;
		}
		.message.user {
			align-self: flex-end;
			background-color: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
		}
		.message.assistant {
			align-self: flex-start;
			background-color: var(--vscode-editor-inactiveSelectionBackground);
			border: 1px solid var(--vscode-panel-border);
		}
		.message.system {
			align-self: center;
			background-color: var(--vscode-notifications-background);
			border: 1px solid var(--vscode-notifications-border);
			font-style: italic;
			max-width: 95%;
		}
		.message-actions {
			margin-top: 8px;
			display: flex;
			gap: 8px;
			flex-wrap: wrap;
		}
		.message-actions button {
			background-color: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			padding: 6px 12px;
			border-radius: 4px;
			cursor: pointer;
			font-size: 12px;
		}
		.message-actions button:hover {
			background-color: var(--vscode-button-hoverBackground);
		}
		.feedback-buttons {
			margin-top: 8px;
			display: flex;
			gap: 8px;
		}
		.feedback-buttons button {
			flex: 1;
			padding: 6px 12px;
			border: 1px solid var(--vscode-panel-border);
			background-color: var(--vscode-editor-background);
			color: var(--vscode-foreground);
			cursor: pointer;
			border-radius: 4px;
		}
		.feedback-buttons button:hover {
			background-color: var(--vscode-list-hoverBackground);
		}
		.feedback-buttons button.positive:hover {
			border-color: var(--vscode-testing-iconPassed);
		}
		.feedback-buttons button.negative:hover {
			border-color: var(--vscode-testing-iconFailed);
		}
		#input-container {
			padding: 16px;
			border-top: 1px solid var(--vscode-panel-border);
			display: flex;
			gap: 8px;
			background-color: var(--vscode-editor-background);
		}
		#user-input {
			flex: 1;
			padding: 8px 12px;
			background-color: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border);
			border-radius: 4px;
			font-family: inherit;
			font-size: 14px;
		}
		#user-input:focus {
			outline: none;
			border-color: var(--vscode-focusBorder);
		}
		#send-button {
			padding: 8px 20px;
			background-color: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			border-radius: 4px;
			cursor: pointer;
			font-weight: 500;
		}
		#send-button:hover {
			background-color: var(--vscode-button-hoverBackground);
		}
		#send-button:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
		.thinking {
			align-self: flex-start;
			padding: 12px;
			color: var(--vscode-descriptionForeground);
			font-style: italic;
		}
		code {
			background-color: var(--vscode-textCodeBlock-background);
			padding: 2px 4px;
			border-radius: 3px;
			font-family: var(--vscode-editor-font-family);
		}
		.welcome-message {
			padding: 20px;
			text-align: center;
			color: var(--vscode-descriptionForeground);
		}
		.welcome-message h2 {
			margin-bottom: 12px;
			color: var(--vscode-foreground);
		}
	</style>
</head>
<body>
	<div id="chat-container">
		<div class="welcome-message">
			<h2>Natural Language Commands Chat</h2>
			<p>Type a command in natural language to get started.</p>
			<p>You can refine commands, provide feedback, and have a conversation to get the right result.</p>
		</div>
	</div>
	<div id="input-container">
		<input type="text" id="user-input" placeholder="Type your command here (e.g., 'Open the terminal and run my tests')..." />
		<button id="send-button">Send</button>
	</div>

	<script>
		(function() {
			const vscode = acquireVsCodeApi();
			const chatContainer = document.getElementById('chat-container');
			const userInput = document.getElementById('user-input');
			const sendButton = document.getElementById('send-button');
			let currentThinking = null;

			function addMessage(role, content, commandResult, showActions) {
				// Remove welcome message if it exists
				const welcome = chatContainer.querySelector('.welcome-message');
				if (welcome) {
					welcome.remove();
				}

				const messageDiv = document.createElement('div');
				messageDiv.className = 'message ' + role;
				
				// Parse markdown-style formatting
				const formattedContent = content
					.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
					.replace(/\`([^\`]+)\`/g, '<code>$1</code>')
					.replace(/\\n/g, '<br>');
				
				messageDiv.innerHTML = formattedContent;

				if (showActions && commandResult) {
					const actionsDiv = document.createElement('div');
					actionsDiv.className = 'message-actions';

					if (commandResult.command) {
						const execBtn = document.createElement('button');
						execBtn.textContent = '▶ Execute Command';
						execBtn.onclick = () => {
							vscode.postMessage({
								type: 'executeCommand',
								command: commandResult.command,
								terminal: null
							});
						};
						actionsDiv.appendChild(execBtn);
					}

					if (commandResult.terminal) {
						const termBtn = document.createElement('button');
						termBtn.textContent = '▶ Run in Terminal';
						termBtn.onclick = () => {
							vscode.postMessage({
								type: 'executeCommand',
								command: null,
								terminal: commandResult.terminal
							});
						};
						actionsDiv.appendChild(termBtn);
					}

					// Add feedback buttons
					const feedbackDiv = document.createElement('div');
					feedbackDiv.className = 'feedback-buttons';

					const correctBtn = document.createElement('button');
					correctBtn.className = 'positive';
					correctBtn.textContent = '👍 This is correct';
					correctBtn.onclick = () => {
						vscode.postMessage({
							type: 'provideFeedback',
							feedback: { wasCorrect: true }
						});
						feedbackDiv.remove();
					};

					const incorrectBtn = document.createElement('button');
					incorrectBtn.className = 'negative';
					incorrectBtn.textContent = '👎 Not what I meant';
					incorrectBtn.onclick = () => {
						const refinement = prompt('What did you mean? (Provide more details)');
						if (refinement) {
							vscode.postMessage({
								type: 'provideFeedback',
								feedback: { wasCorrect: false, userFeedback: refinement }
							});
							vscode.postMessage({
								type: 'refineCommand',
								refinement: refinement
							});
						}
						feedbackDiv.remove();
					};

					feedbackDiv.appendChild(correctBtn);
					feedbackDiv.appendChild(incorrectBtn);

					messageDiv.appendChild(actionsDiv);
					messageDiv.appendChild(feedbackDiv);
				}

				chatContainer.appendChild(messageDiv);
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}

			function setThinking(thinking) {
				if (thinking) {
					if (!currentThinking) {
						currentThinking = document.createElement('div');
						currentThinking.className = 'thinking';
						currentThinking.textContent = 'Thinking...';
						chatContainer.appendChild(currentThinking);
						chatContainer.scrollTop = chatContainer.scrollHeight;
					}
				} else {
					if (currentThinking) {
						currentThinking.remove();
						currentThinking = null;
					}
				}
			}

			function sendMessage() {
				const text = userInput.value.trim();
				if (!text) return;

				vscode.postMessage({
					type: 'userMessage',
					text: text
				});

				userInput.value = '';
				// Note: Don't disable the send button here, as that would prevent
				// users from sending multiple messages if the first one fails.
			}

			sendButton.addEventListener('click', sendMessage);
			// Use keydown instead of deprecated keypress event for better reliability
			userInput.addEventListener('keydown', (e) => {
				if (e.key === 'Enter') {
					e.preventDefault(); // Prevent default to avoid new line in input
					sendMessage();
				}
			});

			// Handle messages from the extension
			window.addEventListener('message', event => {
				const message = event.data;
				switch (message.type) {
					case 'addMessage':
						addMessage(
							message.payload.role,
							message.payload.content,
							message.payload.commandResult,
							message.payload.showActions
						);
						break;
					case 'setThinking':
						setThinking(message.payload.thinking);
						break;
				}
			});

			// Focus input on load
			userInput.focus();
		})();
	</script>
</body>
</html>`;
	}

	public dispose() {
		ChatPanel.currentPanel = undefined;

		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}
}
