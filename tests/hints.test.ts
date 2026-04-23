import { describe, it, expect } from 'vitest'
import { parseEnvHints, parseRequiresHints } from '../src/hints.js'

describe('parseEnvHints', () => {
  it('returns empty object when no hints', () => {
    expect(parseEnvHints('console.log(1)')).toEqual({})
  })

  it('parses a single @env hint', () => {
    const r = parseEnvHints('// @env NODE_ENV=production\n')
    expect(r['NODE_ENV']).toBe('production')
  })

  it('parses multiple @env hints', () => {
    const src = '// @env NODE_ENV=production\n// @env PORT=3000\n'
    const r = parseEnvHints(src)
    expect(r['NODE_ENV']).toBe('production')
    expect(r['PORT']).toBe('3000')
  })

  it('ignores malformed @env lines', () => {
    const r = parseEnvHints('// @env NOEQUALS\n')
    expect(Object.keys(r)).toHaveLength(0)
  })

  it('strips BOM', () => {
    const r = parseEnvHints('\uFEFF// @env KEY=val\n')
    expect(r['KEY']).toBe('val')
  })

  it('handles CRLF', () => {
    const r = parseEnvHints('// @env KEY=val\r\n')
    expect(r['KEY']).toBe('val')
  })
})

describe('parseRequiresHints', () => {
  it('returns empty array when no hints', () => {
    expect(parseRequiresHints('console.log(1)')).toEqual([])
  })

  it('parses a single @requires hint', () => {
    const r = parseRequiresHints('// @requires node>=18\n')
    expect(r).toEqual(['node>=18'])
  })

  it('parses multiple @requires hints', () => {
    const src = '// @requires node>=18\n// @requires bun\n'
    const r = parseRequiresHints(src)
    expect(r).toEqual(['node>=18', 'bun'])
  })

  it('strips BOM', () => {
    const r = parseRequiresHints('\uFEFF// @requires bun\n')
    expect(r).toEqual(['bun'])
  })

  it('handles CRLF', () => {
    const r = parseRequiresHints('// @requires bun\r\n')
    expect(r).toEqual(['bun'])
  })
})
