import * as vscode from 'vscode';
import { apiBaseUrl } from '../constants';
import * as polka from 'polka';
import { TokenManager } from '../TokenManager';

export const authenticate = (fn?: () => void) => {
  const app = polka();

  app.get('/auth/:token', async (req, res) => {
    const { token } = req.params;
    if (!token) {
      res.end(`<h1>Something went wrong</h1>`);
      return;
    }
    
    await TokenManager.setToken(token);

    if (fn) {
      fn();
    }

    res.end(`<h1>Success! You can now close this tab.</h1>`);

    (app as any).server.close();
  });

  app.listen(54321, (err: Error) => {
    if (err) {
      vscode.window.showErrorMessage(err.message);
      return;
    } else {
      vscode.commands.executeCommand(
        'vscode.open',
        vscode.Uri.parse(`${apiBaseUrl}/auth/github`)
      );
    }
  });
};
