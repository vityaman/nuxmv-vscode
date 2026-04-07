import type { NuXmvParser, ProgramContext } from '../generated/NuXmvParser.js'
import type { Diagnostic } from 'vscode-languageserver/node'
import { parseNuXmvDocument } from './parseNuXmv.js'

export class NuXmvUnit {
  private _text = ''
  private _tree: ProgramContext | undefined
  private _parser: NuXmvParser | undefined
  private _diagnostics: Diagnostic[] = []

  get text(): string {
    return this._text
  }

  get tree(): ProgramContext | undefined {
    return this._tree
  }

  get diagnostics(): readonly Diagnostic[] {
    return this._diagnostics
  }

  setText(content: string): void {
    const { tree, diagnostics, parser } = parseNuXmvDocument(content)

    this._text = content
    this._tree = tree
    this._parser = parser
    this._diagnostics = diagnostics
  }

  formatParseTree(): string | undefined {
    if (!this._tree || !this._parser) {
      return undefined
    }

    return this._tree.toStringTree(this._parser)
  }
}
