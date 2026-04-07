import * as assert from 'node:assert'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { DiagnosticSeverity } from 'vscode-languageserver/node'
import { NuXmvLSPService } from '../../server/src/service.js'

/** Resolves `test/unit/resource` when tests run from `dist/test/unit`. */
function resourceFile(name: string): string {
  return path.join(__dirname, '..', '..', '..', 'test', 'unit', 'resource', name)
}

function resourceContent(name: string): string {
  return fs.readFileSync(resourceFile(name), 'utf8')
}

suite('NuXmvLSPService', () => {
  const minimalValid = `MODULE main
VAR
  x : boolean;
ASSIGN
  init(x) := FALSE;
`

  test('analyze returns no diagnostics for a minimal valid module', () => {
    const service = new NuXmvLSPService()
    const uri = 'file:///tmp/example.smv'
    service.setText(uri, minimalValid)
    const diagnostics = service.analyze(uri)
    assert.strictEqual(
      diagnostics.length,
      0,
      `expected no diagnostics, got: ${JSON.stringify(diagnostics)}`,
    )
  })

  test('analyze returns diagnostics for invalid input', () => {
    const service = new NuXmvLSPService()
    const uri = 'file:///tmp/broken.smv'
    service.setText(uri, 'MODULE @@')
    const diagnostics = service.analyze(uri)
    assert.ok(diagnostics.length > 0, 'expected at least one syntax diagnostic')
    assert.strictEqual(diagnostics[0]?.severity, DiagnosticSeverity.Error)
    assert.strictEqual(diagnostics[0]?.source, 'nuxmv')
  })

  test('analyze returns empty list for unknown document', () => {
    const service = new NuXmvLSPService()
    assert.deepStrictEqual(service.analyze('file:///tmp/none.smv'), [])
  })

  const crossroadFixtures = ['counter.smv', 'crossroad.smv', 'philosophers.smv'] as const

  for (const fileName of crossroadFixtures) {
    test(`parses fixture ${fileName} without diagnostics`, () => {
      const source = resourceContent(fileName)
      const service = new NuXmvLSPService()
      const uri = `file:///fixture/${fileName}`
      service.setText(uri, source)
      const diagnostics = service.analyze(uri)
      assert.strictEqual(
        diagnostics.length,
        0,
        `expected no diagnostics for ${fileName}, got: ${JSON.stringify(diagnostics)}`,
      )
    })
  }
})
