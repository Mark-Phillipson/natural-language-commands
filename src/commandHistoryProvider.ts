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