import {
  createConnection,
  DocumentDiagnosticReportKind,
  ProposedFeatures,
  TextDocumentSyncKind,
  TextDocuments,
  type TextDocumentIdentifier,
} from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { NuXmvLSPService } from './service.js'

const connection = createConnection(ProposedFeatures.all)
const documents = new TextDocuments(TextDocument)
const service = new NuXmvLSPService()

documents.onDidOpen((event) => {
  service.setText(event.document.uri, event.document.getText())
})

documents.onDidChangeContent((event) => {
  service.setText(event.document.uri, event.document.getText())
})

documents.onDidClose((event) => {
  service.close(event.document.uri)
})

connection.onInitialize(() => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      diagnosticProvider: {
        interFileDependencies: false,
        workspaceDiagnostics: false,
      },
    },
  }
})

connection.languages.diagnostics.on((params: { textDocument: TextDocumentIdentifier }) => {
  const items = service.analyze(params.textDocument.uri)
  return {
    kind: DocumentDiagnosticReportKind.Full,
    items,
  }
})

documents.listen(connection)
connection.listen()
