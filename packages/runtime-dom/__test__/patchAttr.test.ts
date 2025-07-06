import { describe, expect, it } from 'vitest'
import { patchProp } from '../src/patchProp'

describe('runtime-dom/patchAttr', () => {
  it('should be patch', () => {
    const el = document.createElement('div')
    patchProp(el, 'foo', null, 'foo-value')
    expect(el.getAttribute('foo')).toBe('foo-value')

    patchProp(el, 'foo', 'foo-value', null)
    expect(el.getAttribute('foo')).toBe(null)
  })
})
