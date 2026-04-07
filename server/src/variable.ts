import { AbstractParseTreeVisitor, type TerminalNode } from 'antlr4ng'
import type { ProgramContext } from '../generated/NuXmvParser.js'
import { NuXmvParser } from '../generated/NuXmvParser.js'

class UsedIdentifierVisitor extends AbstractParseTreeVisitor<void> {
  readonly identifiers = new Set<string>()

  override visitTerminal(node: TerminalNode): void {
    if (node.symbol.type === NuXmvParser.IDENT) {
      this.identifiers.add(node.getText())
    }
  }
}

export function collectVariables(tree: ProgramContext): string[] {
  const visitor = new UsedIdentifierVisitor()
  visitor.visit(tree)
  return [...visitor.identifiers].sort((a, b) => a.localeCompare(b))
}
