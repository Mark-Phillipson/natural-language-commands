import * as assert from 'assert';
import { translateTerminalCommandForOS } from '../terminalUtils';

suite('translateTerminalCommandForOS - list directories only', () => {
    const originalPlatform = process.platform;
    
    setup(() => {
        Object.defineProperty(process, 'platform', { value: 'win32' });
    });
    
    teardown(() => {
        Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
    
    test('should translate "ls -d */" to "Get-ChildItem -Directory" on Windows', () => {
        assert.strictEqual(translateTerminalCommandForOS('ls -d */'), 'Get-ChildItem -Directory');
    });
    
    test('should translate "ls -d" to "Get-ChildItem -Directory" on Windows', () => {
        assert.strictEqual(translateTerminalCommandForOS('ls -d'), 'Get-ChildItem -Directory');
    });
    
    test('should translate "ls -d *" to "Get-ChildItem -Directory" on Windows', () => {
        assert.strictEqual(translateTerminalCommandForOS('ls -d *'), 'Get-ChildItem -Directory');
    });
    
    test('should translate "ls -d .*/" to "Get-ChildItem -Directory" on Windows', () => {
        assert.strictEqual(translateTerminalCommandForOS('ls -d .*/'), 'Get-ChildItem -Directory');
    });
    
    test('should still translate regular "ls" to "dir" on Windows', () => {
        assert.strictEqual(translateTerminalCommandForOS('ls'), 'dir');
        assert.strictEqual(translateTerminalCommandForOS('ls -la'), 'dir');
    });
    
    test('should not translate "ls -d */" on non-Windows', () => {
        Object.defineProperty(process, 'platform', { value: 'linux' });
        assert.strictEqual(translateTerminalCommandForOS('ls -d */'), 'ls -d */');
        Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
});
