export class ExampleCommandsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private static examples: string[] = [
        'Clear the command history',
        'Create a new file called hello.txt',
        'Find all TODO comments in the workspace',
        'Open settings in JSON view',
        'Open the debug console',
        'Open the explorer',
        'Open the terminal and run my tests (integrated terminal, not the top menu)',
        'Show the terminal menu (top menu, not the integrated terminal)',
        'Run the build task',
        'Show me my extensions',
        'Show me the command history sidebar',
        'Show me the output panel',
        'Show me the keyboard shortcuts',
        'Show me the settings in JSON',
        'Show me the problems panel',
        'Switch to the source control view',
        'What is the current git branch?',
    ];
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }
    getChildren(): Thenable<vscode.TreeItem[]> {
        return Promise.resolve(ExampleCommandsProvider.examples.map(
            ex => new vscode.TreeItem(ex, vscode.TreeItemCollapsibleState.None)
        ));
    }
}
import * as vscode from 'vscode';

export interface CommandHistoryItem {
    label: string;
    time: Date;
    parameters?: string;
}

export class CommandHistoryProvider implements vscode.TreeDataProvider<CommandHistoryTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<CommandHistoryTreeItem | undefined | void> = new vscode.EventEmitter<CommandHistoryTreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<CommandHistoryTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    private sessionHistory: CommandHistoryItem[] = [];
    private filter: string = '';

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    clear(): void {
        this.sessionHistory = [];
        this.refresh();
    }

    addCommand(item: CommandHistoryItem) {
        this.sessionHistory.unshift(item);
        this.refresh();
    }

    setFilter(filter: string) {
        this.filter = filter;
        this.refresh();
    }

    getTreeItem(element: CommandHistoryTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(): Thenable<CommandHistoryTreeItem[]> {
        let items = this.sessionHistory;
        if (this.filter) {
            const f = this.filter.toLowerCase();
            items = items.filter(item =>
                item.label.toLowerCase().includes(f) ||
                (item.parameters && item.parameters.toLowerCase().includes(f))
            );
        }
        return Promise.resolve(items.map(item => new CommandHistoryTreeItem(item)));
    }
}

export class CommandHistoryTreeItem extends vscode.TreeItem {
    constructor(public readonly item: CommandHistoryItem) {
        super(item.label, vscode.TreeItemCollapsibleState.None);
        this.description = `${item.time.toLocaleTimeString()}${item.parameters ? ' | ' + item.parameters : ''}`;
        this.tooltip = `${item.label}\n${item.time.toLocaleString()}${item.parameters ? '\nParams: ' + item.parameters : ''}`;
        this.contextValue = 'commandHistoryItem';
    }
}