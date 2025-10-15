import * as assert from 'assert';
import { translateTerminalCommandForOS } from '../terminalUtils';

suite('translateTerminalCommandForOS natural language up one level', () => {
    const originalPlatform = process.platform;
    setup(() => {
        Object.defineProperty(process, 'platform', { value: 'win32' });
    });
    teardown(() => {
        Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
    test('should translate "go up one level" to "cd .." on Windows', () => {
        assert.strictEqual(translateTerminalCommandForOS('go up one level'), 'cd ..');
        assert.strictEqual(translateTerminalCommandForOS('go to parent directory'), 'cd ..');
        assert.strictEqual(translateTerminalCommandForOS('parent directory'), 'cd ..');
        assert.strictEqual(translateTerminalCommandForOS('up one level'), 'cd ..');
    });
    test('should not translate on non-Windows', () => {
        Object.defineProperty(process, 'platform', { value: 'linux' });
        assert.strictEqual(translateTerminalCommandForOS('go up one level'), 'go up one level');
        Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
});
