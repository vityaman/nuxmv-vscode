import * as assert from 'node:assert'
import * as fs from 'node:fs'
import * as path from 'node:path'
import {
  assertNuXmvSameDefaultTokenStream,
  formatNuXmvText,
  NuXmvFormatTokenMismatchError,
} from '../../server/src/formatNuXmv.js'

function resourceFile(name: string): string {
  return path.join(__dirname, '..', '..', '..', 'test', 'unit', 'resource', name)
}

function resourceContent(name: string): string {
  return fs.readFileSync(resourceFile(name), 'utf8')
}

const strict = { strict: true as const }

suite('formatNuXmvText', () => {
  const messy = `MODULE   main
VAR
  x : boolean;
ASSIGN
  init(x) := FALSE;
`

  test('idempotent: format(format(x)) === format(x)', () => {
    const f = (s: string) => formatNuXmvText(s, strict)
    const once = f(messy)
    if (once === null) {
      assert.fail('expected format to succeed')
    }
    const twice = f(once)
    if (twice === null) {
      assert.fail('expected second format to succeed')
    }
    assert.strictEqual(twice, once)
  })

  test('triple application matches single (convergence)', () => {
    const f = (s: string) => formatNuXmvText(s, strict)
    const x = messy
    const fx = f(x)
    if (fx === null) {
      assert.fail('expected format to succeed')
    }
    const ffx = f(fx)
    if (ffx === null) {
      assert.fail('expected second format to succeed')
    }
    const fffx = f(ffx)
    if (fffx === null) {
      assert.fail('expected third format to succeed')
    }
    assert.strictEqual(ffx, fx)
    assert.strictEqual(fffx, fx)
  })

  test('returns null when lexing fails', () => {
    assert.strictEqual(formatNuXmvText('MODULE main\n\x00', strict), null)
  })

  test('merges multiple blank lines between constructions into one empty line', () => {
    const input = 'MODULE main\n\n\n\nVAR\n  x : boolean;\n'
    const out = formatNuXmvText(input, strict)
    if (out === null) {
      assert.fail('expected format')
    }
    assert.ok(!out.includes('\n\n\n'), 'expected no run of three or more consecutive newlines')
    assert.match(out, /MODULE main\n\n {2}VAR\n/)
  })

  test('indents rhs after line break following :=', () => {
    const input = 'MODULE main\n  ASSIGN\n    init(cars_crossing_right) := \nzero;\n'
    const out = formatNuXmvText(input, strict)
    if (out === null) {
      assert.fail('expected format')
    }
    assert.match(out, /:=\s*\n {6}zero;/)
  })

  test('indents case arm `:` continuation +2 when condition is on previous line', () => {
    const input = [
      'MODULE main',
      'VAR',
      '  x : boolean;',
      'ASSIGN',
      '  next(x) := case',
      '      (a & b)',
      '      : 1;',
      '      TRUE',
      '      : 0;',
      '    esac;',
      '',
    ].join('\n')
    const out = formatNuXmvText(input, strict)
    if (out === null) {
      assert.fail('expected format')
    }
    assert.match(out, /\(a & b\)\n {8}: 1;/)
    assert.match(out, /\n {6}TRUE\n {8}: 0;/)
    const again = formatNuXmvText(out, strict)
    if (again === null) {
      assert.fail('expected idempotent format')
    }
    assert.strictEqual(again, out)
  })

  test('indents parenthesized case: arms hang under `(`, esac at assign body column', () => {
    const input = [
      'MODULE main',
      'VAR',
      '  x : boolean;',
      'ASSIGN',
      '  next(x) := (1) + (case',
      '        a : 1;',
      '        TRUE : 0;',
      '      esac);',
      '',
    ].join('\n')
    const out = formatNuXmvText(input, strict)
    if (out === null) {
      assert.fail('expected format')
    }
    assert.match(out, /\+\s*\(case\n {6}a : 1;/)
    assert.match(out, /\n {6}TRUE : 0;/)
    assert.match(out, /\n {4}esac\);/)
    const again = formatNuXmvText(out, strict)
    if (again === null) {
      assert.fail('expected idempotent format')
    }
    assert.strictEqual(again, out)
  })

  test('section comment after ASSIGN: no extra blank before LTLSPEC; G F(i) without space before (', () => {
    const input = [
      'MODULE main',
      '  VAR',
      '    i : 0..4;',
      '  ASSIGN',
      '    init(i) := 0;',
      '    next(i) := (i + 1) mod 5;',
      '',
      '  -- Liveness',
      '  LTLSPEC G F(i = 0);',
      '',
    ].join('\n')
    const out = formatNuXmvText(input, strict)
    if (out === null) {
      assert.fail('expected format')
    }
    assert.match(out, /mod 5;\n {2}-- Liveness\n {2}LTLSPEC G F\(i = 0\);/)
    assert.ok(!out.includes('-- Liveness\n\n\n'), 'no stacked blank lines after section comment')
  })

  test('DEFINE `:= (` newline: inner lines use nest +2 only, not stacked assign continuation', () => {
    const input = [
      'MODULE main',
      '  DEFINE',
      '    a := (',
      '        (x) |',
      '        (y)',
      '      );',
      '',
    ].join('\n')
    const out = formatNuXmvText(input, strict)
    if (out === null) {
      assert.fail('expected format')
    }
    assert.match(out, /:= \(\n {6}\(x\) \|/)
    assert.match(out, /\n {6}\(y\)\n {4}\);/)
    const again = formatNuXmvText(out, strict)
    if (again === null) {
      assert.fail('expected idempotent format')
    }
    assert.strictEqual(again, out)
  })

  test('named spec: lines inside `(…)` after line break are indented when := opens parens', () => {
    const input = [
      'MODULE main',
      '  CTLSPEC NAME x := AG (',
      '    (a);',
      '  );',
      '',
    ].join('\n')
    const out = formatNuXmvText(input, strict)
    if (out === null) {
      assert.fail('expected format')
    }
    assert.match(out, /:= AG \(\n {6}\(a\);/)
    assert.match(out, /\n {4}\);/)
  })

  test('preserves a user line break inside an expression', () => {
    const input = [
      'MODULE main',
      'VAR x : boolean;',
      'ASSIGN',
      '  init(x) := 1 +',
      '  2;',
      '',
    ].join('\n')
    const out = formatNuXmvText(input, strict)
    if (out === null) {
      assert.fail('expected format')
    }
    assert.match(out, /:= 1 \+\n {4}2;/)
    const again = formatNuXmvText(out, strict)
    if (again === null) {
      assert.fail('expected idempotent format')
    }
    assert.strictEqual(again, out)
  })

  const fixtures = ['counter.smv', 'crossroad.smv', 'philosophers.smv'] as const
  for (const name of fixtures) {
    test(`fixture ${name} converges under repeated formatting`, () => {
      const source = resourceContent(name)
      const f = (s: string) => formatNuXmvText(s, strict)
      const once = f(source)
      if (once === null) {
        assert.fail(`expected format to succeed for ${name}`)
      }
      const twice = f(once)
      if (twice === null) {
        assert.fail(`expected idempotent format for ${name}`)
      }
      assert.strictEqual(twice, once)
    })
  }

  test('assertNuXmvSameDefaultTokenStream throws when identifiers differ', () => {
    const left = 'MODULE m\nVAR\nx : boolean;\n'
    const right = 'MODULE m\nVAR\ny : boolean;\n'
    assert.throws(
      () => {
        assertNuXmvSameDefaultTokenStream(left, right)
      },
      NuXmvFormatTokenMismatchError,
    )
  })

  test('non-strict matches strict output when default token stream is preserved', () => {
    const lenient = formatNuXmvText(messy, { strict: false })
    const strictOut = formatNuXmvText(messy, strict)
    if (lenient === null || strictOut === null) {
      assert.fail('expected format')
    }
    assert.strictEqual(lenient, strictOut)
  })
})
