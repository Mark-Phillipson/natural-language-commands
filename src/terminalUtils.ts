// Utility for translating Unix-style terminal commands to PowerShell/Windows equivalents
function translateTerminalCommandForOS(cmd: string): string {
    const isWindows = process.platform === 'win32';
    if (!isWindows) {
        return cmd.trim();
    }
    let trimmed = cmd.trim();
    // Normalize multiple spaces to single space
    trimmed = trimmed.replace(/\s+/g, ' ');
    // Natural language: go up one level, parent directory, etc.
    if (/^(go up( one)? level|go to parent( directory)?|up one level|parent directory)$/i.test(trimmed)) {
        return 'cd ..';
    }
    // ls -d */ or ls -d .*/ (list only directories) - must come before general ls check
    if (/^ls\s+-d\s+\*\/?$/i.test(trimmed) || /^ls\s+-d\s+\.\*\/?$/i.test(trimmed)) {
        return 'Get-ChildItem -Directory -Recurse';
    }
    // list directories, list folders, show directories, show folders (with optional recursive flag)
    if (/^(list|show)\s+(all\s+)?(directories|folders|dirs)(\s+recursively)?$/i.test(trimmed)) {
        return 'Get-ChildItem -Directory -Recurse';
    }
    // Any ls command with any flags or extra spaces → dir
    if (/^ls(\s+(-[a-zA-Z]+))*\s*$/i.test(trimmed) || /^ls(\s+[^|]*)?$/i.test(trimmed)) {
        return 'dir';
    }
    // cat file.txt → Get-Content file.txt
    if (/^cat\s+(.+)/i.test(trimmed)) {
        return trimmed.replace(/^cat\s+(.+)/i, 'Get-Content $1');
    }
    // touch file.txt → New-Item file.txt -ItemType File
    if (/^touch\s+(.+)/i.test(trimmed)) {
        return trimmed.replace(/^touch\s+(.+)/i, 'New-Item $1 -ItemType File');
    }
    // rm file.txt → Remove-Item file.txt
    if (/^rm\s+(.+)/i.test(trimmed)) {
        return trimmed.replace(/^rm\s+(.+)/i, 'Remove-Item $1');
    }
    // mv src dest → Move-Item src dest
    if (/^mv\s+([^\s]+)\s+(.+)/i.test(trimmed)) {
        return trimmed.replace(/^mv\s+([^\s]+)\s+(.+)/i, 'Move-Item $1 $2');
    }
    // cp src dest → Copy-Item src dest
    if (/^cp\s+([^\s]+)\s+(.+)/i.test(trimmed)) {
        return trimmed.replace(/^cp\s+([^\s]+)\s+(.+)/i, 'Copy-Item $1 $2');
    }
    // grep pattern file → Select-String -Pattern pattern -Path file
    if (/^grep\s+([^\s]+)\s+(.+)/i.test(trimmed)) {
        return trimmed.replace(/^grep\s+([^\s]+)\s+(.+)/i, 'Select-String -Pattern $1 -Path $2');
    }
    // Default: return as-is
    return trimmed;
}

export { translateTerminalCommandForOS };
