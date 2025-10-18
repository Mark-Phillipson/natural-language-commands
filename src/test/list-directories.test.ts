import * as assert from 'assert';
import { translateTerminalCommandForOS } from '../terminalUtils';

suite('translateTerminalCommandForOS list directories', () => {
    const originalPlatform = process.platform;
    setup(() => {
        Object.defineProperty(process, 'platform', { value: 'win32' });
    });
    teardown(() => {
        Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
    test('should translate "list directories recursively" to PowerShell Get-ChildItem on Windows', () => {
        const result = translateTerminalCommandForOS('list directories recursively');
        assert.strictEqual(result, 'Get-ChildItem -Directory');
    });
    test('should translate "list folders" to PowerShell Get-ChildItem on Windows', () => {
        const result = translateTerminalCommandForOS('list folders');
        assert.strictEqual(result, 'Get-ChildItem -Directory');
    });
    test('should translate "show directories" to PowerShell Get-ChildItem on Windows', () => {
        const result = translateTerminalCommandForOS('show directories');
        assert.strictEqual(result, 'Get-ChildItem -Directory');
    });
    test('should translate "show all folders" to PowerShell Get-ChildItem on Windows', () => {
        const result = translateTerminalCommandForOS('show all folders');
        assert.strictEqual(result, 'Get-ChildItem -Directory');
    });
    test('should translate "ls -d */" to PowerShell Get-ChildItem on Windows', () => {
        const result = translateTerminalCommandForOS('ls -d */');
        assert.strictEqual(result, 'Get-ChildItem -Directory');
    });
});

suite('translateTerminalCommandForOS list directories (non-Windows)', () => {
    const originalPlatform = process.platform;
    setup(() => {
        Object.defineProperty(process, 'platform', { value: 'linux' });
    });
    teardown(() => {
        Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
    test('should not translate on non-Windows', () => {
        const result = translateTerminalCommandForOS('list directories recursively');
        assert.strictEqual(result, 'list directories recursively');
    });
});
