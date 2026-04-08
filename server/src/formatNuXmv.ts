import {
  BaseErrorListener,
  CharStream,
  Token,
  type ATNSimulator,
  type RecognitionException,
  type Recognizer,
} from 'antlr4ng'
import type { Token as AntlrToken } from 'antlr4ng'
import { NuXmvLexer } from '../generated/NuXmvLexer.js'

class LexerErrorCounter extends BaseErrorListener {
  count = 0

  override syntaxError<T extends ATNSimulator>(
    _recognizer: Recognizer<T>,
    _offendingSymbol: unknown,
    _line: number,
    _charPositionInLine: number,
    _msg: string,
    _e: RecognitionException | null,
  ): void {
    void _recognizer
    void _offendingSymbol
    void _line
    void _charPositionInLine
    void _msg
    void _e
    this.count += 1
  }
}

/** Module-level keywords that start a multiline block (newline after keyword, then body indent). */
const MODULE_BODY_BLOCK_OPEN = new Set<number>([
  NuXmvLexer.VAR,
  NuXmvLexer.IVAR,
  NuXmvLexer.FROZENVAR,
  NuXmvLexer.FUN,
  NuXmvLexer.DEFINE,
  NuXmvLexer.ASSIGN,
])

/** Starts a new module element at indent 2 when the current line was a body line at indent 4. */
const MODULE_INNER_HEADERS = new Set<number>([
  ...MODULE_BODY_BLOCK_OPEN,
  NuXmvLexer.CONSTANTS,
  NuXmvLexer.TRANS,
  NuXmvLexer.INVAR,
  NuXmvLexer.FAIRNESS,
  NuXmvLexer.JUSTICE,
  NuXmvLexer.COMPASSION,
  NuXmvLexer.CTLSPEC,
  NuXmvLexer.LTLSPEC,
  NuXmvLexer.INVARSPEC,
  NuXmvLexer.PSLSPEC,
  NuXmvLexer.COMPUTE,
  NuXmvLexer.PRED,
  NuXmvLexer.MIRROR,
  NuXmvLexer.ISA,
  NuXmvLexer.SPEC,
  NuXmvLexer.NAME,
  NuXmvLexer.EXTEND,
  NuXmvLexer.AT,
])

/** After `:=`, these alone do not justify +2 for paren-wrapped continuations at DEFINE/ASSIGN indent. */
const ASSIGN_RHS_GROUP_OPEN = new Set<number>([
  NuXmvLexer.LPAREN,
  NuXmvLexer.LBRACK,
  NuXmvLexer.LBRACE,
])

function tokenText(t: AntlrToken): string {
  const tx = t.text
  if (tx != null) {
    return tx
  }
  const input = t.inputStream
  if (input != null && t.start >= 0 && t.stop >= t.start) {
    return input.getTextFromRange(t.start, t.stop)
  }
  return ''
}

function collectAllTokens(lexer: NuXmvLexer): AntlrToken[] {
  const tokens: AntlrToken[] = []
  let t = lexer.nextToken()
  while (t.type !== Token.EOF) {
    tokens.push(t)
    t = lexer.nextToken()
  }
  return tokens
}

export interface NuXmvDefaultTokenSnapshot {
  readonly type: number
  readonly text: string
}

export class NuXmvFormatTokenMismatchError extends Error {
  override readonly name = 'NuXmvFormatTokenMismatchError'

  constructor(
    message: string,
    readonly beforeCount: number,
    readonly afterCount: number,
  ) {
    super(message)
  }
}

export interface FormatNuXmvOptions {
  /**
   * When true, throw {@link NuXmvFormatTokenMismatchError} if default-channel
   * token sequences differ between input and formatted output.
   * When false, return the original source unchanged if they differ.
   */
  readonly strict?: boolean
}

function defaultChannelSnapshotFromTokens(all: AntlrToken[]): NuXmvDefaultTokenSnapshot[] {
  const out: NuXmvDefaultTokenSnapshot[] = []
  for (const t of all) {
    if (t.channel === Token.DEFAULT_CHANNEL) {
      out.push({ type: t.type, text: tokenText(t) })
    }
  }
  return out
}

function lexDefaultChannelSnapshot(source: string): NuXmvDefaultTokenSnapshot[] | null {
  const errors = new LexerErrorCounter()
  const lexer = new NuXmvLexer(CharStream.fromString(source))
  lexer.removeErrorListeners()
  lexer.addErrorListener(errors)
  const all = collectAllTokens(lexer)
  if (errors.count > 0) {
    return null
  }
  return defaultChannelSnapshotFromTokens(all)
}

function snapshotsEqual(
  a: readonly NuXmvDefaultTokenSnapshot[],
  b: readonly NuXmvDefaultTokenSnapshot[],
): boolean {
  if (a.length !== b.length) {
    return false
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i].type !== b[i].type || a[i].text !== b[i].text) {
      return false
    }
  }
  return true
}

/**
 * Re-lexes both strings and throws if their default-channel token sequences differ.
 */
export function assertNuXmvSameDefaultTokenStream(original: string, formatted: string): void {
  const before = lexDefaultChannelSnapshot(original)
  if (before === null) {
    throw new Error('assertNuXmvSameDefaultTokenStream: original source failed to lex')
  }
  const after = lexDefaultChannelSnapshot(formatted)
  if (after === null) {
    throw new NuXmvFormatTokenMismatchError(
      'formatted output failed to lex',
      before.length,
      -1,
    )
  }
  if (!snapshotsEqual(before, after)) {
    throw new NuXmvFormatTokenMismatchError(
      'formatting changed the default-channel token stream',
      before.length,
      after.length,
    )
  }
}

function nextDefaultIndex(tokens: AntlrToken[], from: number): number {
  let k = from
  while (k < tokens.length && tokens[k].channel !== Token.DEFAULT_CHANNEL) {
    k += 1
  }
  return k
}

function endsWithNewline(out: string[]): boolean {
  for (let j = out.length - 1; j >= 0; j--) {
    const part = out[j]
    if (part.length === 0) {
      continue
    }
    return part.endsWith('\n')
  }
  return false
}

/** Ensures at most one trailing newline on the built output (merges `\n\n+` into `\n`). */
function emitNl(out: string[]): void {
  if (endsWithNewline(out)) {
    return
  }
  out.push('\n')
}

function endsWithBlankLine(out: string[]): boolean {
  return /\r?\n[ \t]*\r?\n\s*$/.test(out.join(''))
}

/** One empty line before the next line (`\n\n`), without stacking extra newlines. */
function ensureBlankLineBeforeNextLine(out: string[]): void {
  if (out.length === 0) {
    return
  }
  if (!endsWithNewline(out)) {
    out.push('\n')
  }
  if (!endsWithBlankLine(out)) {
    out.push('\n')
  }
}

const UNARY_MINUS_PREV = new Set<number>([
  NuXmvLexer.LPAREN,
  NuXmvLexer.LBRACK,
  NuXmvLexer.LBRACE,
  NuXmvLexer.COMMA,
  NuXmvLexer.COLON,
  NuXmvLexer.ASSIGN_OP,
  NuXmvLexer.PLUS,
  NuXmvLexer.MINUS,
  NuXmvLexer.STAR,
  NuXmvLexer.DIV,
  NuXmvLexer.MOD,
  NuXmvLexer.AND,
  NuXmvLexer.OR,
  NuXmvLexer.PIPE,
  NuXmvLexer.ARROW,
  NuXmvLexer.IFF,
  NuXmvLexer.EQ,
  NuXmvLexer.NEQ,
  NuXmvLexer.LT,
  NuXmvLexer.GT,
  NuXmvLexer.LE,
  NuXmvLexer.GE,
])

function needsSpaceBetween(prevPrev: number | null, prev: number | null, next: number): boolean {
  if (prev === null) {
    return false
  }
  if (prev === NuXmvLexer.NOT) {
    if (
      next === NuXmvLexer.LPAREN
      || next === NuXmvLexer.IDENT
      || next === NuXmvLexer.LTL_X
      || next === NuXmvLexer.LTL_F
      || next === NuXmvLexer.LTL_G
      || next === NuXmvLexer.LTL_Y
      || next === NuXmvLexer.LTL_Z
      || next === NuXmvLexer.LTL_H
      || next === NuXmvLexer.LTL_O
      || next === NuXmvLexer.LTL_S
      || next === NuXmvLexer.LTL_T
      || next === NuXmvLexer.CTL_E
      || next === NuXmvLexer.CTL_A
    ) {
      return false
    }
  }
  if (
    (
      prev === NuXmvLexer.LTL_F
      || prev === NuXmvLexer.LTL_X
      || prev === NuXmvLexer.LTL_V
      || prev === NuXmvLexer.LTL_Y
      || prev === NuXmvLexer.LTL_Z
      || prev === NuXmvLexer.LTL_H
      || prev === NuXmvLexer.LTL_O
      || prev === NuXmvLexer.LTL_S
      || prev === NuXmvLexer.LTL_T
      || prev === NuXmvLexer.CTL_E
      || prev === NuXmvLexer.CTL_A
    )
    && next === NuXmvLexer.LPAREN
  ) {
    return false
  }
  if (prev === NuXmvLexer.MINUS && next === NuXmvLexer.POS_INT) {
    if (prevPrev === null || UNARY_MINUS_PREV.has(prevPrev)) {
      return false
    }
    return true
  }
  if (next === NuXmvLexer.SEMI) {
    return false
  }
  if (prev === NuXmvLexer.LPAREN || prev === NuXmvLexer.LBRACK || prev === NuXmvLexer.LBRACE) {
    return false
  }
  if (
    next === NuXmvLexer.RPAREN
    || next === NuXmvLexer.RBRACK
    || next === NuXmvLexer.RBRACE
    || next === NuXmvLexer.COMMA
    || next === NuXmvLexer.SEMI
  ) {
    return false
  }
  if (next === NuXmvLexer.DOT || prev === NuXmvLexer.DOT) {
    return false
  }
  if (prev === NuXmvLexer.IDENT && next === NuXmvLexer.LPAREN) {
    return false
  }
  if (prev === NuXmvLexer.EXTEND && next === NuXmvLexer.LPAREN) {
    return false
  }
  if (prev === NuXmvLexer.IDENT && next === NuXmvLexer.LBRACK) {
    return false
  }
  if (
    (prev === NuXmvLexer.INIT || prev === NuXmvLexer.NEXT || prev === NuXmvLexer.COUNT)
    && next === NuXmvLexer.LPAREN
  ) {
    return false
  }
  if (prev === NuXmvLexer.COMMA) {
    return true
  }
  if (prev === NuXmvLexer.COLON && next === NuXmvLexer.ASSIGN_OP) {
    return false
  }
  return true
}

function commentIndentForNextDefault(
  inModuleBody: boolean,
  lineIndent: number,
  nextDefaultType: number | null,
): number {
  if (
    inModuleBody
    && lineIndent >= 4
    && nextDefaultType !== null
    && MODULE_INNER_HEADERS.has(nextDefaultType)
  ) {
    return 2
  }
  return lineIndent
}

function emitLineComment(out: string[], indent: number, text: string): void {
  if (out.length > 0) {
    emitNl(out)
  }
  out.push(' '.repeat(indent))
  out.push(text)
  out.push('\n')
}

function emitBlockComment(out: string[], indent: number, text: string): void {
  if (text.includes('\n') || text.includes('\r')) {
    if (out.length > 0) {
      emitNl(out)
    }
    out.push(' '.repeat(indent))
    out.push(text.trim())
    out.push('\n')
  }
  else {
    out.push(' ')
    out.push(text.trim())
    out.push(' ')
  }
}

/**
 * Lexer-driven pretty-printer. Deterministic so format(format(x)) === format(x).
 *
 * - Single newlines between tokens use `emitNl` (no stacked empty lines from layout alone).
 * - If hidden whitespace between tokens contains a blank line (`\\n\\s*\\n`), one empty line
 *   is kept before the next line (`ensureBlankLineBeforeNextLine`).
 * - If the original whitespace between two tokens contained a line break, that break is kept
 *   as a single newline before the next token when still inside an expression (mid-line).
 * - `case` / `esac` arms are indented +2 spaces per nesting level; `esac` aligns with its `case`.
 * - Parentheses / brackets add +2 per nesting level for continuation lines; closers outdent one step.
 * - From `:=` until `;`, user line breaks in the rhs set a +2 continuation on subsequent line starts; a
 *   `case` rhs clears that extra so case-arm rules apply. Blank lines before the next default token only
 *   when that blank line is in whitespace immediately before that token (not before an intervening comment).
 * - Line comments before a module inner header (`LTLSPEC`, `VAR`, …) use indent 2 when the current body
 *   line was at indent ≥ 4, so section comments align with those headers.
 *
 * After formatting, default-channel (non-whitespace) token sequences are compared
 * before vs after. With `strict: false` (default), a mismatch returns the original
 * source. With `strict: true`, a mismatch throws {@link NuXmvFormatTokenMismatchError}.
 */
export function formatNuXmvText(source: string, options?: FormatNuXmvOptions): string | null {
  const errors = new LexerErrorCounter()
  const input = CharStream.fromString(source)
  const lexer = new NuXmvLexer(input)
  lexer.removeErrorListeners()
  lexer.addErrorListener(errors)

  const tokens = collectAllTokens(lexer)
  if (errors.count > 0) {
    return null
  }

  const out: string[] = []
  let prevDefault: number | null = null
  let atLineStart = true
  let lineIndent = 0
  let moduleHead = false
  let inModuleBody = false
  let expectModuleName = false
  let moduleParamDepth = 0

  const flushHidden = (
    from: number,
    until: number,
  ): { k: number, hadNewlineInWs: boolean, paragraphBreakBeforeNextDefault: boolean } => {
    const nd = nextDefaultIndex(tokens, from)
    let nextDefTy: number | null = null
    if (nd < tokens.length && tokens[nd].channel === Token.DEFAULT_CHANNEL) {
      nextDefTy = tokens[nd].type
    }
    const cIndent = commentIndentForNextDefault(inModuleBody, lineIndent, nextDefTy)

    let k = from
    let hadNewlineInWs = false
    /** True only if hidden whitespace *immediately* before the next default token contains a blank line. */
    let paragraphBreakBeforeNextDefault = false
    let wsRun = ''
    while (k < until) {
      const h = tokens[k]
      if (h.channel !== Token.HIDDEN_CHANNEL) {
        break
      }
      if (h.type === NuXmvLexer.WS) {
        const w = tokenText(h)
        wsRun += w
        if (/[\r\n]/.test(w)) {
          hadNewlineInWs = true
        }
        if (/\r?\n[ \t]*\r?\n/.test(wsRun)) {
          paragraphBreakBeforeNextDefault = true
        }
        k += 1
        continue
      }
      wsRun = ''
      if (h.type === NuXmvLexer.LINE_COMMENT) {
        paragraphBreakBeforeNextDefault = false
        emitLineComment(out, cIndent, tokenText(h))
        atLineStart = true
      }
      else if (h.type === NuXmvLexer.BLOCK_COMMENT) {
        paragraphBreakBeforeNextDefault = false
        emitBlockComment(out, cIndent, tokenText(h))
        atLineStart = endsWithNewline(out)
      }
      k += 1
    }
    return { k, hadNewlineInWs, paragraphBreakBeforeNextDefault }
  }

  let caseDepth = 0
  let nestDepth = 0
  let prevPrevDefault: number | null = null
  /**
   * True from `:=` until `;` for the current statement (assign, DEFINE, named spec, …).
   * Newlines after `:=` or inside parens may set {@link assignRhsContinuationExtra} (see main loop).
   */
  let assignRhsStatementActive = false
  /** True once the rhs has seen a token other than leading `(`, `[`, `{` after `:=`. */
  let assignRhsSeenNonGroupTokenAfterOp = false
  /** +2 on line starts for the multiline rhs of the current `:=` statement. */
  let assignRhsContinuationExtra = false

  const emitDefault = (ty: number, text: string): void => {
    if (MODULE_INNER_HEADERS.has(ty) && inModuleBody && atLineStart && lineIndent === 4) {
      lineIndent = 2
    }

    if (atLineStart) {
      let indentCols: number
      if (ty === NuXmvLexer.ESAC) {
        indentCols = lineIndent + 2 * Math.max(0, nestDepth - 1) + 2 * Math.max(0, caseDepth - 1)
      }
      else if (ty === NuXmvLexer.RPAREN || ty === NuXmvLexer.RBRACK || ty === NuXmvLexer.RBRACE) {
        let caseExtras = 0
        if (caseDepth > 0) {
          caseExtras = nestDepth > 0 ? 2 * (caseDepth - 1) : 2 * caseDepth
        }
        indentCols = lineIndent + 2 * Math.max(0, nestDepth - 1) + caseExtras
      }
      else {
        let caseExtras = 0
        if (caseDepth > 0) {
          caseExtras = nestDepth > 0 ? 2 * (caseDepth - 1) : 2 * caseDepth
        }
        indentCols = lineIndent + 2 * nestDepth + caseExtras
      }
      if (assignRhsContinuationExtra) {
        indentCols += 2
      }
      if (ty === NuXmvLexer.COLON && caseDepth > 0) {
        indentCols += 2
      }
      out.push(' '.repeat(indentCols))
      atLineStart = false
    }
    else if (needsSpaceBetween(prevPrevDefault, prevDefault, ty)) {
      out.push(' ')
    }

    out.push(text)

    if (ty === NuXmvLexer.LPAREN || ty === NuXmvLexer.LBRACK || ty === NuXmvLexer.LBRACE) {
      nestDepth += 1
    }
    else if (ty === NuXmvLexer.RPAREN || ty === NuXmvLexer.RBRACK || ty === NuXmvLexer.RBRACE) {
      nestDepth = Math.max(0, nestDepth - 1)
    }

    prevPrevDefault = prevDefault
    prevDefault = ty

    if (ty === NuXmvLexer.CASE) {
      caseDepth += 1
    }
    if (ty === NuXmvLexer.ESAC) {
      caseDepth = Math.max(0, caseDepth - 1)
    }
  }

  let i = 0
  while (i < tokens.length) {
    const { k: nextI, hadNewlineInWs, paragraphBreakBeforeNextDefault } = flushHidden(i, tokens.length)
    i = nextI
    if (i >= tokens.length) {
      break
    }

    const t = tokens[i]
    if (t.channel !== Token.DEFAULT_CHANNEL) {
      i += 1
      continue
    }

    const ty = t.type
    const text = tokenText(t)

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- loop-carried `atLineStart` / `paragraphBreakBeforeNextDefault`
    if (paragraphBreakBeforeNextDefault && atLineStart) {
      ensureBlankLineBeforeNextLine(out)
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- loop-carried `atLineStart` is false mid-statement
    if (hadNewlineInWs && !atLineStart) {
      emitNl(out)
      atLineStart = true
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- loop-carried `prevDefault`
      if (prevDefault === NuXmvLexer.ASSIGN_OP) {
        assignRhsContinuationExtra = true
      }
      else if (
        assignRhsStatementActive
        && nestDepth > 0
        && caseDepth === 0
        && (
          lineIndent < 4
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- loop-carried `prevDefault`
          || (assignRhsSeenNonGroupTokenAfterOp && prevDefault === NuXmvLexer.LPAREN)
        )
      ) {
        assignRhsContinuationExtra = true
      }
    }

    if (ty === NuXmvLexer.MODULE) {
      nestDepth = 0
      caseDepth = 0
      prevPrevDefault = null
      prevDefault = null
      assignRhsStatementActive = false
      assignRhsSeenNonGroupTokenAfterOp = false
      assignRhsContinuationExtra = false
      if (out.length > 0) {
        emitNl(out)
      }
      lineIndent = 0
      atLineStart = true
      moduleHead = true
      inModuleBody = false
      expectModuleName = true
      moduleParamDepth = 0
    }

    emitDefault(ty, text)
    i += 1

    if (ty === NuXmvLexer.ASSIGN_OP) {
      assignRhsStatementActive = true
      assignRhsSeenNonGroupTokenAfterOp = false
    }
    if (assignRhsStatementActive && ty !== NuXmvLexer.ASSIGN_OP && !ASSIGN_RHS_GROUP_OPEN.has(ty)) {
      assignRhsSeenNonGroupTokenAfterOp = true
    }
    if (ty === NuXmvLexer.CASE) {
      assignRhsContinuationExtra = false
    }

    if (expectModuleName && ty === NuXmvLexer.IDENT) {
      expectModuleName = false
      const nd = nextDefaultIndex(tokens, i)
      if (nd >= tokens.length || tokens[nd].type !== NuXmvLexer.LPAREN) {
        emitNl(out)
        moduleHead = false
        inModuleBody = true
        lineIndent = 2
        atLineStart = true
      }
    }

    if (moduleHead && !inModuleBody && ty === NuXmvLexer.LPAREN) {
      moduleParamDepth += 1
    }
    if (moduleHead && !inModuleBody && ty === NuXmvLexer.RPAREN && moduleParamDepth > 0) {
      moduleParamDepth -= 1
      if (moduleParamDepth === 0) {
        emitNl(out)
        moduleHead = false
        inModuleBody = true
        lineIndent = 2
        atLineStart = true
      }
    }

    if (MODULE_BODY_BLOCK_OPEN.has(ty) && inModuleBody && lineIndent === 2) {
      emitNl(out)
      lineIndent = 4
      atLineStart = true
    }

    if (ty === NuXmvLexer.SEMI) {
      assignRhsStatementActive = false
      assignRhsSeenNonGroupTokenAfterOp = false
      assignRhsContinuationExtra = false
      emitNl(out)
      atLineStart = true
      if (inModuleBody) {
        lineIndent = 4
      }
    }
  }

  let result = out.join('')
  if (result.length > 0) {
    result = result.replace(/\n+$/, '\n')
  }

  const strict = options?.strict ?? false
  try {
    assertNuXmvSameDefaultTokenStream(source, result)
  }
  catch (e) {
    if (e instanceof NuXmvFormatTokenMismatchError) {
      if (strict) {
        throw e
      }
      return source
    }
    throw e
  }

  return result
}
