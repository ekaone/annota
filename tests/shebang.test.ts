import { describe, it, expect } from 'vitest'
import { parseShebang } from '../src/shebang.js'

describe('parseShebang', () => {
  it('returns null for empty string', () => {
    expect(parseShebang('')).toBeNull()
  })

  it('returns null when no shebang', () => {
    expect(parseShebang('// @ts-check\nconsole.log(1)')).toBeNull()
  })

  it('parses /usr/bin/env bun', () => {
    const r = parseShebang('#!/usr/bin/env bun\n')
    expect(r).not.toBeNull()
    expect(r!.executor).toBe('bun')
    expect(r!.args).toEqual([])
    expect(r!.raw).toBe('#!/usr/bin/env bun')
  })

  it('parses /usr/bin/env tsx', () => {
    const r = parseShebang('#!/usr/bin/env tsx\n')
    expect(r!.executor).toBe('tsx')
  })

  it('parses /usr/bin/env ts-node', () => {
    const r = parseShebang('#!/usr/bin/env ts-node\n')
    expect(r!.executor).toBe('ts-node')
  })

  it('parses deno with args', () => {
    const r = parseShebang('#!/usr/bin/env -S deno run --allow-net\n')
    expect(r!.executor).toBe('deno')
    expect(r!.args).toEqual(['run', '--allow-net'])
  })

  it('parses ts-node with --files flag', () => {
    const r = parseShebang('#!/usr/bin/env -S ts-node --files\n')
    expect(r!.executor).toBe('ts-node')
    expect(r!.args).toEqual(['--files'])
  })

  it('parses direct path /usr/bin/python3', () => {
    const r = parseShebang('#!/usr/bin/python3\n')
    expect(r!.executor).toBe('python3')
    expect(r!.args).toEqual([])
  })

  it('parses /bin/bash', () => {
    const r = parseShebang('#!/bin/bash\n')
    expect(r!.executor).toBe('bash')
  })

  it('parses /usr/bin/env python3', () => {
    const r = parseShebang('#!/usr/bin/env python3\n')
    expect(r!.executor).toBe('python3')
  })

  it('strips BOM before parsing', () => {
    const r = parseShebang('\uFEFF#!/usr/bin/env bun\n')
    expect(r!.executor).toBe('bun')
  })

  it('handles CRLF line endings', () => {
    const r = parseShebang('#!/usr/bin/env bun\r\nconsole.log(1)')
    expect(r!.executor).toBe('bun')
  })

  it('returns raw shebang line', () => {
    const r = parseShebang('#!/usr/bin/env bun\n')
    expect(r!.raw).toBe('#!/usr/bin/env bun')
  })

  it('parses ruby', () => {
    const r = parseShebang('#!/usr/bin/env ruby\n')
    expect(r!.executor).toBe('ruby')
  })

  it('parses node', () => {
    const r = parseShebang('#!/usr/bin/env node\n')
    expect(r!.executor).toBe('node')
  })
})
