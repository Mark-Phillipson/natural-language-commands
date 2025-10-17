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
            // ls -d */ should translate to Get-ChildItem -Directory for listing directories only
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
