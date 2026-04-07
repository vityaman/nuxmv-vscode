import { AbstractParseTreeVisitor, type TerminalNode } from 'antlr4ng'
import { Range } from 'vscode-languageserver/node'
import type { ProgramContext } from '../generated/NuXmvParser.js'
import { NuXmvParser } from '../generated/NuXmvParser.js'

export interface IdentifierOccurrence {
  readonly name: string
  readonly range: Range
}

class UsedIdentifierVisitor extends AbstractParseTreeVisitor<void> {
  readonly identifiers = new Set<string>()

  override visitTerminal(node: TerminalNode): void {
    if (node.symbol.type === NuXmvParser.IDENT) {
      this.identifiers.add(node.getText())
    }
  }
}

class IdentifierOccurrenceVisitor extends AbstractParseTreeVisitor<void> {
  readonly occurrences: IdentifierOccurrence[] = []

  override visitTerminal(node: TerminalNode): void {
    if (node.symbol.type !== NuXmvParser.IDENT) {
      return
    }
    const token = node.symbol
    const line0 = token.line - 1
    const startChar = token.column
    const text = node.getText()
    const len = Math.max(1, text.length)
    this.occurrences.push({
      name: text,
      range: Range.create(line0, startChar, line0, startChar + len),
    })
  }
}

export function collectVariables(tree: ProgramContext): string[] {
  const visitor = new UsedIdentifierVisitor()
  visitor.visit(tree)
  return [...visitor.identifiers].sort((a, b) => a.localeCompare(b))
}

export function collectIdentifierOccurrences(tree: ProgramContext): IdentifierOccurrence[] {
  const visitor = new IdentifierOccurrenceVisitor()
  visitor.visit(tree)
  return visitor.occurrences
}
