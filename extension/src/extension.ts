import * as vscode from 'vscode';
import { SidebarProvider } from './SidebarProvider';
import { authenticate } from './helpers/authenticate';
import { TokenManager } from './TokenManager';

export function activate(context: vscode.ExtensionContext) {

  TokenManager.globalState = context.globalState;

  const sidebarProvider = new SidebarProvider(context.extensionUri);

  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  item.text = '$(beaker) Add Todo';
  item.tooltip = "HEEEEE";
  item.command = 'procrastinator.addTodo';
  item.show();

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('procrastinator-sidebar', sidebarProvider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('procrastinator.authenticate', () => {
     try {
       authenticate();
     } catch (err) {
        console.error(err);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('procrastinator.addTodo', () => {
      const { activeTextEditor } = vscode.window;
      if (!activeTextEditor) {
        vscode.window.showInformationMessage('No active text editor found');
      }

      const text = activeTextEditor?.document?.getText(
        activeTextEditor.selection
      );

      if (!text) {
        vscode.window.showInformationMessage('No text selected');
      }

      vscode.window.showInformationMessage(`Selection: ${text}`);
      sidebarProvider._view?.webview?.postMessage({
        type: 'add-todo',
        value: text,
      });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('procrastinator.refresh', () => {
      setTimeout(() => {
        vscode.commands.executeCommand(
          'workbench.action.webview.openDeveloperTools'
        );
      }, 500);
    })
  );
}

export function deactivate() {}
