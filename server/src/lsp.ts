import type { Position, Range, TextEdit } from 'vscode-languageserver/node'

export function positionInRange(position: Position, range: Range): boolean {
  const { start, end } = range
  if (position.line < start.line || position.line > end.line) {
    return false
  }
  if (position.line === start.line && position.line === end.line) {
    return position.character >= start.character && position.character < end.character
  }
  if (position.line === start.line) {
    return position.character >= start.character
  }
  if (position.line === end.line) {
    return position.character < end.character
  }
  return true
}

export function sortTextEdits(edits: TextEdit[]): TextEdit[] {
  return [...edits].sort((a, b) => {
    if (a.range.end.line !== b.range.end.line) {
      return b.range.end.line - a.range.end.line
    }
    return b.range.end.character - a.range.end.character
  })
}
