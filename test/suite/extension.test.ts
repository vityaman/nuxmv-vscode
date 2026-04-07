import * as assert from 'assert'
import * as vscode from 'vscode'

suite('nuXmv extension', () => {
  test('contributes nuxmv language id', async () => {
    const ids = await vscode.languages.getLanguages()
    assert.ok(ids.includes('nuxmv'))
  })
})
