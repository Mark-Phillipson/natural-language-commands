import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export type ProjectType = 'node' | 'dotnet' | 'unknown';

/**
 * Detects the project type in the current workspace.
 * Returns 'node' for Node.js, 'dotnet' for .NET, or 'unknown'.
 */
export async function detectProjectType(): Promise<ProjectType> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) { return 'unknown'; }
    const folder = folders[0].uri.fsPath;
    // Check for package.json (Node.js)
    if (fs.existsSync(path.join(folder, 'package.json'))) {
        return 'node';
    }
    // Recursively search for .csproj or .sln files in all subfolders
    function findDotnetFiles(dir: string): boolean {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isFile() && (entry.name.endsWith('.csproj') || entry.name.endsWith('.sln'))) {
                return true;
            }
            if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
                if (findDotnetFiles(fullPath)) {
                    return true;
                }
            }
        }
        return false;
    }
    if (findDotnetFiles(folder)) {
        return 'dotnet';
    }
    return 'unknown';
}

/**
 * Given a natural language intent (e.g. 'run tests'), returns the correct terminal command for the detected project type.
 * Returns { command, language }.
 */
export async function getTestCommandForProject(): Promise<{ command: string, language: string }> {
    const type = await detectProjectType();
    if (type === 'node') {
        return { command: 'npm test', language: 'Node.js' };
    } else if (type === 'dotnet') {
        return { command: 'dotnet test', language: '.NET' };
    } else {
        return { command: 'npm test', language: 'Unknown' };
    }
}

/**
 * Given a natural language intent (e.g. 'build'), returns the correct build command for the detected project type.
 * Returns { command, language }.
 */
export async function getBuildCommandForProject(): Promise<{ command: string, language: string }> {
    const type = await detectProjectType();
    if (type === 'node') {
        return { command: 'npm run build', language: 'Node.js' };
    } else if (type === 'dotnet') {
        return { command: 'dotnet build', language: '.NET' };
    } else {
        return { command: 'npm run build', language: 'Unknown' };
    }
}