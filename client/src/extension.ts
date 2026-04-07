import * as vscode from 'vscode'
import { NuXmvLSPClient } from './client.js'

let client: NuXmvLSPClient | undefined

export function activate(context: vscode.ExtensionContext): void {
  client = new NuXmvLSPClient(context)
  client.start()
}

export async function deactivate(): Promise<void> {
  await client?.stop()
  client = undefined
}
