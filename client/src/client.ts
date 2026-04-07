import * as path from 'node:path'
import * as vscode from 'vscode'
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node'

export class NuXmvLSPClient {
  private client: LanguageClient | undefined

  constructor(private readonly context: vscode.ExtensionContext) {}

  start(): void {
    const serverModule = this.context.asAbsolutePath(
      path.join('dist', 'server', 'src', 'server.js'),
    )

    const serverOptions: ServerOptions = {
      run: { module: serverModule, transport: TransportKind.ipc },
      debug: {
        module: serverModule,
        transport: TransportKind.ipc,
        options: { execArgv: ['--nolazy', '--inspect=6009'] },
      },
    }

    const clientOptions: LanguageClientOptions = {
      documentSelector: [{ scheme: 'file', language: 'nuxmv' }],
      diagnosticPullOptions: {
        onChange: true,
        onSave: true,
      },
    }

    this.client = new LanguageClient('nuxmv', 'nuXmv Language Server', serverOptions, clientOptions)
    void this.client.start()
  }

  async stop(): Promise<void> {
    if (this.client != null) {
      await this.client.stop()
      this.client = undefined
    }
  }
}
