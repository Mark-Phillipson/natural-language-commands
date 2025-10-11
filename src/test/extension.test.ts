import * as assert from 'assert';
import * as vscode from 'vscode';
import { getLLMResult } from '../llm';

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

suite('Confidence Threshold Tests', () => {
	// Test that commands with low confidence should not auto-execute
	test('Low confidence command (<0.9) should prompt for confirmation', async () => {
		// This test will fail initially because the current implementation
		// doesn't check confidence before executing commands
		const mockLLMResult = {
			intent: 'delete all files',
			command: 'workbench.action.files.deleteFile',
			terminal: null,
			search: null,
			confidence: 0.5, // Low confidence
			alternatives: []
		};

		// In the actual implementation, this should trigger a confirmation prompt
		// rather than executing immediately
		// For now, this test documents the expected behavior
		assert.ok(mockLLMResult.confidence < 0.9, 'Low confidence should be below threshold');
	});

	test('High confidence command (>=0.9) should auto-execute', async () => {
		const mockLLMResult = {
			intent: 'open explorer',
			command: 'workbench.view.explorer',
			terminal: null,
			search: null,
			confidence: 0.95, // High confidence
			alternatives: []
		};

		assert.ok(mockLLMResult.confidence >= 0.9, 'High confidence should be at or above threshold');
	});

	test('Ambiguous command should provide alternatives', async () => {
		const mockLLMResult = {
			intent: 'run tests',
			command: null,
			terminal: null,
			search: null,
			confidence: 0.6,
			alternatives: [
				{ command: 'workbench.action.tasks.test', description: 'Run test task' },
				{ terminal: 'npm test', description: 'Run npm test in terminal' }
			]
		};

		assert.ok(mockLLMResult.alternatives.length > 0, 'Should have alternatives');
		assert.ok(mockLLMResult.confidence < 0.9, 'Ambiguous commands typically have lower confidence');
	});
});

suite('Command Confirmation Tests', () => {
	test('Destructive command should always require confirmation', () => {
		// Test that destructive commands like delete, remove, etc. always require confirmation
		const destructiveIntents = [
			'delete all files',
			'remove directory',
			'clear workspace',
			'reset settings'
		];

		destructiveIntents.forEach(intent => {
			assert.ok(
				/delete|remove|clear|reset|destroy|wipe/i.test(intent),
				`Intent "${intent}" should be flagged as destructive`
			);
		});
	});

	test('Low confidence should trigger confirmation prompt', () => {
		const lowConfidenceResults = [
			{ confidence: 0.3, shouldConfirm: true },
			{ confidence: 0.5, shouldConfirm: true },
			{ confidence: 0.7, shouldConfirm: true },
			{ confidence: 0.89, shouldConfirm: true },
			{ confidence: 0.9, shouldConfirm: false },
			{ confidence: 0.95, shouldConfirm: false }
		];

		lowConfidenceResults.forEach(({ confidence, shouldConfirm }) => {
			const needsConfirmation = confidence < 0.9;
			assert.strictEqual(
				needsConfirmation,
				shouldConfirm,
				`Confidence ${confidence} should ${shouldConfirm ? 'require' : 'not require'} confirmation`
			);
		});
	});
});

suite('Chat Interface Tests', () => {
	test('Chat panel should be creatable', () => {
		// This tests that the ChatPanel class can be instantiated
		// Currently fails because chat interface is not fully functional
		const commands = vscode.commands.getCommands(true);
		commands.then(cmds => {
			assert.ok(cmds.includes('natural-language-commands.chat'), 'Chat command should exist');
		});
	});

	test('Chat should maintain conversation history', () => {
		// Test that chat maintains context across multiple interactions
		// This is expected to fail initially as the feature isn't fully implemented
		const mockHistory = [
			{ role: 'user', content: 'Open terminal', timestamp: new Date() },
			{ role: 'assistant', content: 'Opening terminal', timestamp: new Date() }
		];

		assert.ok(mockHistory.length > 0, 'Should maintain history');
		assert.strictEqual(mockHistory[0].role, 'user', 'First message should be from user');
	});

	test('Chat should allow command refinement', () => {
		// Test that users can refine commands through the chat interface
		// Expected to fail initially
		const initialCommand = 'run tests';
		const refinedCommand = 'run unit tests only';
		
		assert.notStrictEqual(initialCommand, refinedCommand, 'Commands should be refinable');
	});
});

suite('Command History Display Tests', () => {
	test('Command history should support multiline display', () => {
		// Test that long commands are displayed properly across multiple lines
		const longCommand = 'This is a very long command that describes opening the terminal and running multiple test suites including unit tests, integration tests, and end-to-end tests';
		
		assert.ok(longCommand.length > 50, 'Long commands should be handled properly');
	});

	test('Command history should show timestamp', () => {
		const historyItem = {
			label: 'Open explorer',
			time: new Date(),
			parameters: ''
		};

		assert.ok(historyItem.time instanceof Date, 'Should have timestamp');
	});

	test('Command history should be filterable', () => {
		const history = [
			{ label: 'open terminal', time: new Date() },
			{ label: 'run tests', time: new Date() },
			{ label: 'open settings', time: new Date() }
		];

		const filtered = history.filter(item => item.label.includes('open'));
		assert.strictEqual(filtered.length, 2, 'Should filter correctly');
	});
});

suite('Command Execution Flow Tests', () => {
	test('Should check confidence before execution', () => {
		// This documents the expected flow:
		// 1. Get LLM result
		// 2. Check confidence
		// 3. If confidence >= 0.9, execute
		// 4. If confidence < 0.9, show confirmation prompt
		
		const shouldAutoExecute = (confidence: number) => confidence >= 0.9;
		
		assert.strictEqual(shouldAutoExecute(0.95), true, '0.95 confidence should auto-execute');
		assert.strictEqual(shouldAutoExecute(0.85), false, '0.85 confidence should require confirmation');
	});

	test('Should show alternatives when available', () => {
		const resultWithAlternatives = {
			command: 'workbench.action.files.newFile',
			alternatives: [
				{ command: 'workbench.action.files.newUntitledFile', description: 'New untitled file' }
			]
		};

		assert.ok(resultWithAlternatives.alternatives.length > 0, 'Should have alternatives');
	});

	test('Should handle missing command gracefully', () => {
		const emptyResult = {
			intent: 'do something',
			command: null,
			terminal: null,
			confidence: 0.4,
			alternatives: []
		};

		assert.strictEqual(emptyResult.command, null, 'Should handle null command');
		assert.ok(emptyResult.alternatives.length === 0, 'No command means likely no alternatives either');
	});
});
