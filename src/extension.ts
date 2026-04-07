import * as vscode from 'vscode'

let logChannel: vscode.OutputChannel | undefined

export function activate(): void {
  logChannel = vscode.window.createOutputChannel('nuXmv')
  const msg = '[nuXmv] Extension active: nuXmv grammar registered.'
  logChannel.appendLine(msg)
  console.log(msg)
}

export function deactivate(): void {
  logChannel?.dispose()
  logChannel = undefined
}
