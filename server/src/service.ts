import {
  CompletionItem,
  CompletionItemKind,
  type Diagnostic,
  type DocumentUri,
  Location,
  type Position,
  Range,
  TextEdit,
  WorkspaceEdit,
} from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { formatNuXmvText } from './formatNuXmv.js'
import { positionInRange, sortTextEdits } from './lsp.js'
import { NU_XMV_BUILTIN_FUNCTIONS, NU_XMV_KEYWORDS } from './name.js'
import { NuXmvUnit } from './unit.js'

function variableKind(label: string): CompletionItemKind {
  const isUppercaseName = /[A-Z]/.test(label) && !/[a-z]/.test(label)
  return isUppercaseName ? CompletionItemKind.Constant : CompletionItemKind.Variable
}

export class NuXmvLSPService {
  private readonly units = new Map<DocumentUri, NuXmvUnit>()

  setText(uri: DocumentUri, text: string): void {
    let unit = this.units.get(uri)
    if (!unit) {
      unit = new NuXmvUnit()
      this.units.set(uri, unit)
    }
    unit.setText(text)
  }

  close(uri: DocumentUri): void {
    this.units.delete(uri)
  }

  analyze(uri: DocumentUri): Diagnostic[] {
    const unit = this.units.get(uri)
    if (!unit) {
      return []
    }

    return [...unit.diagnostics]
  }

  formatDocument(uri: DocumentUri): TextEdit[] | null {
    const unit = this.units.get(uri)
    if (!unit) {
      return null
    }

    const text = unit.text
    const formatted = formatNuXmvText(text, { strict: false })
    if (formatted === null) {
      return null
    }
    if (formatted === text) {
      return []
    }

    const doc = TextDocument.create(uri, 'nuxmv', 0, text)
    const end = doc.positionAt(text.length)
    return [TextEdit.replace(Range.create(0, 0, end.line, end.character), formatted)]
  }

  completion(uri: DocumentUri): CompletionItem[] {
    const unit = this.units.get(uri)
    const items: CompletionItem[] = []

    for (const label of NU_XMV_KEYWORDS) {
      items.push({ label, kind: CompletionItemKind.Keyword })
    }
    for (const label of NU_XMV_BUILTIN_FUNCTIONS) {
      items.push({ label, kind: CompletionItemKind.Function })
    }
    if (unit) {
      for (const label of unit.variables) {
        items.push({ label, kind: variableKind(label) })
      }
    }

    return items
  }

  references(uri: DocumentUri, position: Position): Location[] | null {
    const unit = this.units.get(uri)
    if (!unit) {
      return null
    }

    const occurrences = unit.identifierOccurrences
    const at = occurrences.find(o => positionInRange(position, o.range))
    if (!at) {
      return null
    }

    return occurrences.filter(o => o.name === at.name).map(o => Location.create(uri, o.range))
  }

  prepareRename(
    uri: DocumentUri,
    position: Position,
  ): { range: Range, placeholder: string } | null {
    const unit = this.units.get(uri)
    if (!unit) {
      return null
    }

    const occurrences = unit.identifierOccurrences
    const at = occurrences.find(o => positionInRange(position, o.range))
    if (!at) {
      return null
    }

    return { range: at.range, placeholder: at.name }
  }

  rename(uri: DocumentUri, position: Position, newName: string): WorkspaceEdit | null {
    const unit = this.units.get(uri)
    if (!unit) {
      return null
    }

    const occurrences = unit.identifierOccurrences
    const at = occurrences.find(o => positionInRange(position, o.range))
    if (!at) {
      return null
    }

    const edits = sortTextEdits(
      occurrences
        .filter(o => o.name === at.name)
        .map(o => TextEdit.replace(o.range, newName)),
    )
    return { changes: { [uri]: edits } }
  }
}
