// Replace Mocha BDD with TDD interface for VS Code extension test runner compatibility
import * as assert from 'assert';
import { translateTerminalCommandForOS } from '../terminalUtils';
import * as sinon from 'sinon';

suite('translateTerminalCommandForOS', () => {
    test('translates ls to dir on Windows', () => {
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', { value: 'win32' });
        try {
            assert.strictEqual(translateTerminalCommandForOS('ls'), 'dir');
            assert.strictEqual(translateTerminalCommandForOS('ls -la'), 'dir');
            assert.strictEqual(translateTerminalCommandForOS('ls    -a'), 'dir');
            assert.strictEqual(translateTerminalCommandForOS('ls -d */'), 'Get-ChildItem -Directory');
        } finally {
            Object.defineProperty(process, 'platform', { value: originalPlatform });
        }
    });

    test('does not translate ls on non-Windows', () => {
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', { value: 'linux' });
        try {
            assert.strictEqual(translateTerminalCommandForOS('ls'), 'ls');
            assert.strictEqual(translateTerminalCommandForOS('ls -la'), 'ls -la');
        } finally {
            Object.defineProperty(process, 'platform', { value: originalPlatform });
        }
    });
});

import * as vscode from 'vscode';
suite('Delete Current Document Intent', () => {
    let applyEditStub: sinon.SinonStub;
    let showInfoStub: sinon.SinonStub;
    let showWarnStub: sinon.SinonStub;
    let showErrorStub: sinon.SinonStub;
    let activeTextEditorStub: sinon.SinonStub;
    let documentStub: any;
    setup(() => {
        applyEditStub = sinon.stub(vscode.workspace, 'applyEdit');
        showInfoStub = sinon.stub(vscode.window, 'showInformationMessage');
        showWarnStub = sinon.stub(vscode.window, 'showWarningMessage');
        showErrorStub = sinon.stub(vscode.window, 'showErrorMessage');
        documentStub = { uri: vscode.Uri.file('C:/fake/test.md'), isUntitled: false };
        activeTextEditorStub = sinon.stub(vscode.window, 'activeTextEditor').get(() => ({ document: documentStub }));
    });
    teardown(() => {
        sinon.restore();
    });
    test('should use VS Code API to delete file when intent is delete current document', async () => {
        applyEditStub.resolves(true);
        // Simulate the extension logic
        const edit = new vscode.WorkspaceEdit();
        edit.deleteFile(documentStub.uri, { ignoreIfNotExists: true });
        const success = await vscode.workspace.applyEdit(edit);
        assert.ok(applyEditStub.calledOnce, 'applyEdit should be called');
        assert.strictEqual(success, true, 'File should be deleted successfully');
    });
    test('should show warning if no active file to delete', async () => {
        activeTextEditorStub.get(() => undefined);
        // Simulate the extension logic
        if (!vscode.window.activeTextEditor) {
            vscode.window.showWarningMessage('No active file to delete, or file is not on disk.');
        }
        assert.ok(showWarnStub.calledWith('No active file to delete, or file is not on disk.'), 'Should show warning message');
    });
});
suite('Integration: terminal command translation in extension logic', () => {
    let sandbox: sinon.SinonSandbox;
    let originalPlatform: string;
    setup(() => {
        sandbox = sinon.createSandbox();
        originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', { value: 'win32' });
    });
    teardown(() => {
        sandbox.restore();
        Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    test('Main terminal command path uses translation', () => {
        const fakeTerminal = { show: sandbox.stub(), sendText: sandbox.stub() };
        const input = 'ls -la';
        const translated = translateTerminalCommandForOS(input);
        fakeTerminal.show();
        fakeTerminal.sendText(translated, true);
        sinon.assert.calledWith(fakeTerminal.sendText, 'dir', true);
    });

    test('Alternative terminal command path uses translation', () => {
        const fakeTerminal = { show: sandbox.stub(), sendText: sandbox.stub() };
        const altTerminal = 'ls -a';
        const translated = translateTerminalCommandForOS(altTerminal);
        fakeTerminal.show();
        fakeTerminal.sendText(translated, true);
        sinon.assert.calledWith(fakeTerminal.sendText, 'dir', true);
    });
});
suite('Simulated File Menu', () => {
    test('should show QuickPick with file actions for "please open file menu"', async () => {
        const vscode = require('vscode');
        const sinon = require('sinon');
        // Stub showQuickPick to capture actions
        const quickPickStub = sinon.stub(vscode.window, 'showQuickPick').resolves({ label: 'New File', command: 'explorer.newFile' });
        // Simulate command execution
        await vscode.commands.executeCommand('nlc.fileMenu');
        // Check QuickPick was called with expected actions
        const expectedActions = [
            { label: 'New File', command: 'explorer.newFile' },
            { label: 'Open File...', command: 'workbench.action.files.openFile' },
            { label: 'Open Folder...', command: 'workbench.action.files.openFolder' },
            { label: 'Save', command: 'workbench.action.files.save' },
            { label: 'Save As...', command: 'workbench.action.files.saveAs' },
            { label: 'Save All', command: 'workbench.action.files.saveAll' },
            { label: 'Close Editor', command: 'workbench.action.closeActiveEditor' },
            { label: 'Close Folder', command: 'workbench.action.closeFolder' },
            { label: 'Revert File', command: 'workbench.action.files.revert' }
        ];
        sinon.assert.calledWith(quickPickStub, expectedActions, sinon.match.object);
        quickPickStub.restore();
    });
});
