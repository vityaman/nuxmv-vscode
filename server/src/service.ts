import {
  CompletionItem,
  CompletionItemKind,
  type Diagnostic,
  type DocumentUri,
} from 'vscode-languageserver/node'
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
}
