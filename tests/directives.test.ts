import { describe, it, expect } from 'vitest'
import { parseDirectives } from '../src/directives.js'

describe('parseDirectives', () => {
  it('detects @ts-check', () => {
    const r = parseDirectives('// @ts-check\nconsole.log(1)')
    expect(r.tsCheck).toBe(true)
    expect(r.tsNoCheck).toBe(false)
  })

  it('detects @ts-nocheck', () => {
    const r = parseDirectives('// @ts-nocheck\nconsole.log(1)')
    expect(r.tsCheck).toBe(false)
    expect(r.tsNoCheck).toBe(true)
  })

  it('returns false for both when absent', () => {
    const r = parseDirectives('console.log(1)')
    expect(r.tsCheck).toBe(false)
    expect(r.tsNoCheck).toBe(false)
  })

  it('detects @ts-check after shebang line', () => {
    const r = parseDirectives('#!/usr/bin/env bun\n// @ts-check\nconsole.log(1)')
    expect(r.tsCheck).toBe(true)
  })

  it('handles extra spaces around directive', () => {
    const r = parseDirectives('  // @ts-check  \n')
    expect(r.tsCheck).toBe(true)
  })

  it('strips BOM', () => {
    const r = parseDirectives('\uFEFF// @ts-check\n')
    expect(r.tsCheck).toBe(true)
  })

  it('handles CRLF', () => {
    const r = parseDirectives('// @ts-check\r\nconsole.log(1)')
    expect(r.tsCheck).toBe(true)
  })

  it('does not detect directive in comments mid-file', () => {
    const filler = Array(25).fill('// line').join('\n')
    const r = parseDirectives(filler + '\n// @ts-check\n')
    expect(r.tsCheck).toBe(false)
  })
})
