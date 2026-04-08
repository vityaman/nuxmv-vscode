import {
  createConnection,
  DocumentDiagnosticReportKind,
  ProposedFeatures,
  TextDocumentSyncKind,
  TextDocuments,
  type DocumentFormattingParams,
  type PrepareRenameParams,
  type ReferenceParams,
  type RenameParams,
  type TextDocumentIdentifier,
  type TextDocumentPositionParams,
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
      completionProvider: {
        resolveProvider: false,
      },
      diagnosticProvider: {
        interFileDependencies: false,
        workspaceDiagnostics: false,
      },
      referencesProvider: true,
      renameProvider: {
        prepareProvider: true,
      },
      documentFormattingProvider: true,
    },
  }
})

connection.onCompletion((params: TextDocumentPositionParams) => {
  return service.completion(params.textDocument.uri)
})

connection.onReferences((params: ReferenceParams) => {
  return service.references(params.textDocument.uri, params.position)
})

connection.onPrepareRename((params: PrepareRenameParams) => {
  return service.prepareRename(params.textDocument.uri, params.position)
})

connection.onRenameRequest((params: RenameParams) => {
  return service.rename(params.textDocument.uri, params.position, params.newName)
})

connection.onDocumentFormatting((params: DocumentFormattingParams) => {
  return service.formatDocument(params.textDocument.uri)
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
