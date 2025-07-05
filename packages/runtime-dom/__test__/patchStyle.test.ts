import { describe, expect, it } from 'vitest'
import { patchProp } from '../src/patchProp'

describe('runtime-dom/patchStyle', () => {
  it('should be patch', () => {
    const el = document.createElement('div')
    patchProp(el, 'style', {}, 'color:red')
    expect(el.style.cssText.replace(/\s/g, '')).toBe('color:red;')
  })
})
