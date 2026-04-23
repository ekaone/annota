import { describe, it, expect } from 'vitest'
import { parseJSDoc } from '../src/jsdoc.js'

const block = (inner: string) => `/**\n${inner}\n */\n`

describe('parseJSDoc', () => {
  it('returns nulls when no JSDoc block', () => {
    const r = parseJSDoc('console.log(1)')
    expect(r.description).toBeNull()
    expect(r.version).toBeNull()
    expect(r.author).toBeNull()
    expect(r.tags).toEqual({})
  })

  it('parses @description', () => {
    const r = parseJSDoc(block(' * @description My cool script'))
    expect(r.description).toBe('My cool script')
  })

  it('parses @version', () => {
    const r = parseJSDoc(block(' * @version 1.2.3'))
    expect(r.version).toBe('1.2.3')
  })

  it('parses @author', () => {
    const r = parseJSDoc(block(' * @author ekaone'))
    expect(r.author).toBe('ekaone')
  })

  it('extracts bare description lines before first tag', () => {
    const src = `/**\n * My script description\n * @version 1.0.0\n */\n`
    const r = parseJSDoc(src)
    expect(r.description).toBe('My script description')
    expect(r.version).toBe('1.0.0')
  })

  it('parses arbitrary tags into tags map', () => {
    const r = parseJSDoc(block(' * @license MIT\n * @env production'))
    expect(r.tags['license']).toBe('MIT')
    expect(r.tags['env']).toBe('production')
  })

  it('parses full block', () => {
    const src = `#!/usr/bin/env bun
/**
 * Build script for the project
 * @version 2.0.0
 * @author ekaone
 * @license MIT
 */
import { build } from 'bun'
`
    const r = parseJSDoc(src)
    expect(r.description).toBe('Build script for the project')
    expect(r.version).toBe('2.0.0')
    expect(r.author).toBe('ekaone')
    expect(r.tags['license']).toBe('MIT')
  })

  it('returns null values for empty tags', () => {
    const r = parseJSDoc(block(' * @version'))
    expect(r.version).toBeNull()
  })

  it('handles unclosed JSDoc block gracefully', () => {
    const r = parseJSDoc('/**\n * @version 1.0.0\nconsole.log(1)')
    expect(r.version).toBeNull()
  })

  it('handles BOM', () => {
    const r = parseJSDoc('\uFEFF' + block(' * @version 1.0.0'))
    expect(r.version).toBe('1.0.0')
  })
})
