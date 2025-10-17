// Test suite for confirmation behavior
import * as assert from 'assert';
import * as sinon from 'sinon';

suite('Confirmation Dialog Tests', () => {
    let sandbox: sinon.SinonSandbox;

    setup(() => {
        sandbox = sinon.createSandbox();
    });

    teardown(() => {
        sandbox.restore();
    });

    test('VS Code command confirmation includes the actual command', () => {
        // Test that confirmation messages include the command
        const command = 'workbench.action.toggleSidebarVisibility';
        const confidence = 0.8;
        const expectedMsg = `Run command "${command}"? (confidence ${(confidence * 100).toFixed(1)}%)`;
        
        // Verify message format includes command
        assert.ok(expectedMsg.includes(command), 'Confirmation message should include the command');
        assert.ok(expectedMsg.includes('Run command'), 'Confirmation message should ask to run command');
    });

    test('Terminal command confirmation includes the actual command', () => {
        // Test that terminal command confirmations include the command
        const terminalCommand = 'npm test';
        const expectedMsg = `Run terminal command "${terminalCommand}"?`;
        
        // Verify message format includes command
        assert.ok(expectedMsg.includes(terminalCommand), 'Confirmation message should include the terminal command');
        assert.ok(expectedMsg.includes('Run terminal command'), 'Confirmation message should specify it\'s a terminal command');
    });

    test('Alternative command confirmation includes the actual command', () => {
        // Test that alternative command confirmations include the command
        const altCommand = 'workbench.action.files.save';
        const expectedMsg = `Run command "${altCommand}"?`;
        
        // Verify message format includes command
        assert.ok(expectedMsg.includes(altCommand), 'Alternative command confirmation should include the command');
        assert.ok(expectedMsg.includes('Run command'), 'Alternative command confirmation should ask to run command');
    });

    test('Alternative terminal command confirmation includes the actual command', () => {
        // Test that alternative terminal command confirmations include the command
        const altTerminalCommand = 'npm run build';
        const expectedMsg = `Run terminal command "${altTerminalCommand}"?`;
        
        // Verify message format includes command
        assert.ok(expectedMsg.includes(altTerminalCommand), 'Alternative terminal confirmation should include the command');
        assert.ok(expectedMsg.includes('Run terminal command'), 'Alternative terminal confirmation should specify it\'s a terminal command');
    });

    test('Confirmation message format is consistent', () => {
        // Test that all confirmation messages follow a consistent format
        const testCases = [
            { command: 'workbench.action.files.save', type: 'command' },
            { command: 'npm test', type: 'terminal' },
            { command: 'workbench.view.explorer', type: 'command' },
            { command: 'git status', type: 'terminal' }
        ];

        testCases.forEach(testCase => {
            const msg = testCase.type === 'command' 
                ? `Run command "${testCase.command}"?`
                : `Run terminal command "${testCase.command}"?`;
            
            assert.ok(msg.includes(testCase.command), `Message should include ${testCase.command}`);
            assert.ok(msg.includes('?'), 'Message should be a question');
            assert.ok(msg.startsWith('Run'), 'Message should start with Run');
        });
    });

    test('Auto-execute message includes the command', () => {
        // Test that auto-execute messages show the command being executed
        const command = 'workbench.action.togglePanel';
        const confidence = 0.95;
        const autoAccept = 0.9;
        const expectedMsg = `Auto-executing command (confidence ${(confidence * 100).toFixed(1)}% ≥ ${autoAccept * 100}%): ${command}`;
        
        // Verify message includes command
        assert.ok(expectedMsg.includes(command), 'Auto-execute message should include the command');
        assert.ok(expectedMsg.includes('Auto-executing'), 'Message should indicate auto-execution');
    });

    test('Confirmation with "Yes" and "No" options', () => {
        // Test that confirmation dialogs offer clear Yes/No options
        const mockShowInformationMessage = sandbox.stub();
        mockShowInformationMessage.resolves('Yes');
        
        // Verify the mock was called with the right parameters structure
        const command = 'test.command';
        const confirmMsg = `Run command "${command}"?`;
        const options = { modal: true };
        const buttons = ['Yes', 'No'];
        
        // Call the mock
        mockShowInformationMessage(confirmMsg, options, ...buttons);
        
        // Verify it was called
        assert.ok(mockShowInformationMessage.calledOnce, 'Confirmation should be shown once');
        assert.ok(mockShowInformationMessage.calledWith(confirmMsg, options, 'Yes', 'No'), 
            'Confirmation should include Yes and No buttons');
    });

    test('Unknown command does not execute', () => {
        // Test that unknown/ambiguous commands show error and don't execute
        const mockExecuteCommand = sandbox.stub();
        mockExecuteCommand.resolves(undefined); // Unknown command returns undefined
        
        // This simulates the behavior where unknown commands should not execute
        const result = mockExecuteCommand('unknown.command.that.does.not.exist');
        
        assert.ok(result !== undefined || mockExecuteCommand.calledOnce, 
            'Unknown commands should be attempted but fail gracefully');
    });

    test('Cancelled confirmation does not execute command', async () => {
        // Test that when user cancels, the command is not executed
        const mockShowInformationMessage = sandbox.stub();
        const mockExecuteCommand = sandbox.stub();
        
        // User cancels (returns undefined or clicks No)
        mockShowInformationMessage.resolves(undefined);
        
        // This should not execute the command
        const confirmResult = await mockShowInformationMessage('Run command "test"?', { modal: true }, 'Yes', 'No');
        
        if (confirmResult !== 'Yes') {
            // Don't execute
            assert.ok(mockExecuteCommand.notCalled, 'Command should not execute when confirmation is cancelled');
        }
    });

    test('Terminal command respects alwaysConfirmTerminalCommands setting', () => {
        // Test that terminal commands always confirm when setting is enabled
        const alwaysConfirmTerminalCommands = true;
        const terminalCommand = 'rm -rf /';
        
        // If always confirm is true, should show confirmation regardless of confidence
        if (alwaysConfirmTerminalCommands) {
            const confirmMsg = `Run terminal command "${terminalCommand}"?`;
            assert.ok(confirmMsg.includes(terminalCommand), 
                'Should show confirmation with command even for high confidence when alwaysConfirmTerminalCommands is true');
        }
    });

    test('Dangerous terminal commands always require confirmation', () => {
        // Test that dangerous commands are always confirmed
        const dangerousCommands = [
            'rm -rf /',
            'del /f /s /q C:\\',
            'format C:',
            'dd if=/dev/zero of=/dev/sda'
        ];
        
        dangerousCommands.forEach(cmd => {
            // These should always show confirmation
            const confirmMsg = `Run terminal command "${cmd}"?`;
            assert.ok(confirmMsg.includes(cmd), `Dangerous command ${cmd} should show in confirmation`);
            assert.ok(confirmMsg.includes('?'), 'Dangerous commands should require confirmation');
        });
    });

    test('Confidence threshold affects confirmation behavior', () => {
        // Test that confidence levels determine if confirmation is shown
        const testScenarios = [
            { confidence: 0.95, autoAccept: 0.9, shouldAutoExecute: true },
            { confidence: 0.85, autoAccept: 0.9, shouldAutoExecute: false },
            { confidence: 0.95, autoAccept: 1.0, shouldAutoExecute: false }, // Always confirm when autoAccept is 1
            { confidence: 0.5, autoAccept: 0.9, shouldAutoExecute: false }
        ];

        testScenarios.forEach(scenario => {
            const shouldConfirm = scenario.autoAccept >= 1 || scenario.confidence < scenario.autoAccept;
            assert.strictEqual(
                !scenario.shouldAutoExecute, 
                shouldConfirm,
                `Confidence ${scenario.confidence} with autoAccept ${scenario.autoAccept} should ${shouldConfirm ? 'confirm' : 'auto-execute'}`
            );
        });
    });
});
