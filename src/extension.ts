'use strict';

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext): void {
    console.log('Extension "vscode-extension" is now active');

    const disposable = vscode.commands.registerCommand(
        'vscode-extension.helloWorld',
        () => {
            void vscode.window.showInformationMessage('Hello from vscode-extension!');
        }
    );

    context.subscriptions.push(disposable);
}

export function deactivate(): void {
    console.log('Extension "vscode-extension" is now deactivated');
};
