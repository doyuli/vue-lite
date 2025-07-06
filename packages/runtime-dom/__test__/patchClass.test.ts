import { describe, expect, it } from 'vitest'
import { patchProp } from '../src/patchProp'

describe('runtime-dom/patchClass', () => {
  it('should be patch', () => {
    const el = document.createElement('div')
    patchProp(el, 'class', null, 'foo')
    expect(el.className).toBe('foo')

    patchProp(el, 'class', null, null)
    expect(el.className).toBe('')
  })
})
