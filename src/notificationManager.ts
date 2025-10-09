import * as vscode from 'vscode';

export interface Notification {
  message: string;
  timestamp: Date;
  read: boolean;
}

export class NotificationManager {
  private notifications: Notification[] = [];
  private alertStatusBar: vscode.StatusBarItem;
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.alertStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.updateAlertStatusBar();
    this.alertStatusBar.command = 'natural-language-commands.showAlerts';
    this.alertStatusBar.show();
    context.subscriptions.push(this.alertStatusBar);

    const showAlertsDisposable = vscode.commands.registerCommand('natural-language-commands.showAlerts', async () => {
      if (this.notifications.length === 0) {
        vscode.window.showInformationMessage('No alerts.');
        return;
      }
      // Show all notifications, newest first
      const items = this.notifications.slice().reverse().map((n, i) => {
        const idx = this.notifications.length - 1 - i;
        return {
          label: n.message,
          description: n.timestamp.toLocaleTimeString(),
          idx
        };
      });
      await vscode.window.showQuickPick(items, {
        placeHolder: 'Alert messages',
        canPickMany: false
      });
      // Mark all as read after viewing
      this.notifications.forEach(n => { n.read = true; });
      this.updateAlertStatusBar();
    });
    context.subscriptions.push(showAlertsDisposable);
  }

  addNotification(message: string) {
    this.notifications.push({
      message,
      timestamp: new Date(),
      read: false
    });
    this.updateAlertStatusBar();
  }

  private updateAlertStatusBar() {
    const unread = this.notifications.filter(n => !n.read).length;
    this.alertStatusBar.text = unread > 0 ? `$(alert) Alerts (${unread})` : '$(alert) Alerts';
    this.alertStatusBar.tooltip = unread > 0 ? `${unread} unread alert(s)` : 'Show alert messages';
  }
}