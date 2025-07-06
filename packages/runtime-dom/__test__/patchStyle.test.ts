import { describe, expect, it, vi } from 'vitest'
import { patchProp } from '../src/patchProp'

describe('runtime-dom/patchStyle', () => {
  it('should be patch string', () => {
    const el = document.createElement('div')
    patchProp(el, 'style', {}, 'color:red;')
    expect(el.style.cssText.replace(/\s/g, '')).toBe('color:red;')
  })

  it('should be patch object', () => {
    const el = document.createElement('div')
    patchProp(el, 'style', {}, { color: 'red' })
    expect(el.style.cssText.replace(/\s/g, '')).toBe('color:red;')
  })

  it('should camelCase', () => {
    const el = document.createElement('div')
    patchProp(el, 'style', {}, { marginRight: '10px' })
    expect(el.style.cssText.replace(/\s/g, '')).toBe('margin-right:10px;')
  })

  it('should remove if falsy value', () => {
    const el = document.createElement('div')
    patchProp(el, 'style', null, {
      color: undefined,
      borderRadius: null,
    })
    expect(el.style.cssText.replace(/\s/g, '')).toBe('')

    patchProp(
      el,
      'style',
      { color: 'red' },
      { color: null, borderRadius: undefined },
    )
    expect(el.style.cssText.replace(/\s/g, '')).toBe('')
  })

  it('should patch with falsy style value', () => {
    const el = document.createElement('div')
    patchProp(el as any, 'style', { width: '100px' }, { width: 0 })
    expect(el.style.width).toBe('0px')
  })

  it('should clear previous css string value', () => {
    const el = document.createElement('div')
    patchProp(el, 'style', {}, 'color:red')
    expect(el.style.cssText.replace(/\s/g, '')).toBe('color:red;')

    patchProp(el, 'style', 'color:red', { fontSize: '12px' })
    expect(el.style.cssText.replace(/\s/g, '')).toBe('font-size:12px;')
  })

  it('should not patch same string style', () => {
    const el = document.createElement('div')
    const patchFn = vi.fn()
    const cssText = 'color:red;'
    el.style.cssText = cssText
    Object.defineProperty(el.style, 'cssText', {
      get() {
        return cssText
      },
      set: patchFn,
    })
    patchProp(el, 'style', cssText, cssText)
    expect(patchFn).not.toBeCalled()
  })
})
