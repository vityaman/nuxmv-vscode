import {
  BaseErrorListener,
  CharStream,
  CommonTokenStream,
  RecognitionException,
  type ATNSimulator,
  type Recognizer,
} from 'antlr4ng'
import type { Token } from 'antlr4ng'
import {
  Diagnostic,
  DiagnosticSeverity,
  Range,
} from 'vscode-languageserver/node'
import { NuXmvLexer } from '../generated/NuXmvLexer.js'
import { NuXmvParser, type ProgramContext } from '../generated/NuXmvParser.js'

function antlrThrownDiagnostic(message: string): Diagnostic {
  return {
    severity: DiagnosticSeverity.Error,
    range: Range.create(0, 0, 0, 0),
    message,
    source: 'nuxmv',
  }
}

class CollectingErrorListener extends BaseErrorListener {
  readonly diagnostics: Diagnostic[] = []

  override syntaxError<T extends ATNSimulator>(
    _recognizer: Recognizer<T>,
    offendingSymbol: Token | null,
    line: number,
    charPositionInLine: number,
    msg: string,
    exception: RecognitionException | null,
  ): void {
    if (exception != null) {
      this.diagnostics.push(antlrThrownDiagnostic(exception.message))
      return
    }

    let len = 1
    if (offendingSymbol != null) {
      const t = offendingSymbol.text
      if (t != null) {
        len = Math.max(1, t.length)
      }
    }

    const line0 = line - 1
    const range = Range.create(line0, charPositionInLine, line0, charPositionInLine + len)

    this.diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: range,
      message: msg,
      source: 'nuxmv',
    })
  }
}

export interface ParseNuXmvResult {
  readonly tree: ProgramContext | undefined
  readonly diagnostics: Diagnostic[]
  readonly parser: NuXmvParser
}

export function parseNuXmvDocument(text: string): ParseNuXmvResult {
  const errors = new CollectingErrorListener()

  const input = CharStream.fromString(text)

  const lexer = new NuXmvLexer(input)
  lexer.removeErrorListeners()
  lexer.addErrorListener(errors)

  const tokens = new CommonTokenStream(lexer)

  const parser = new NuXmvParser(tokens)
  parser.removeErrorListeners()
  parser.addErrorListener(errors)

  let tree: ProgramContext | undefined
  try {
    tree = parser.program()
  }
  catch (thrown: unknown) {
    tree = undefined
    if (thrown instanceof Error) {
      errors.diagnostics.push(antlrThrownDiagnostic(thrown.message))
    }
  }

  return { tree, diagnostics: errors.diagnostics, parser }
}
