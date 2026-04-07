import type { Diagnostic, DocumentUri } from 'vscode-languageserver/node'
import { NuXmvUnit } from './unit.js'

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
}
