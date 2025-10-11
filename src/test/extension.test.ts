import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('Chat command should be registered', async () => {
		// Verify that the chat command is registered
		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes('natural-language-commands.chat'), 'Chat command should be registered');
	});

	test('Configuration settings should be available', () => {
		const config = vscode.workspace.getConfiguration('naturalLanguageCommands');
		
		// Check if chat mode configuration exists
		const enableChatMode = config.inspect('enableChatMode');
		assert.ok(enableChatMode !== undefined, 'enableChatMode configuration should exist');
		
		// Check if feedback storage configuration exists
		const enableFeedbackStorage = config.inspect('enableFeedbackStorage');
		assert.ok(enableFeedbackStorage !== undefined, 'enableFeedbackStorage configuration should exist');
	});
});
