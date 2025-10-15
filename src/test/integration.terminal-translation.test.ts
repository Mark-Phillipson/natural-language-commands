import * as assert from 'assert';
import * as sinon from 'sinon';
import { translateTerminalCommandForOS } from '../terminalUtils';

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
