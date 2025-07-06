import { describe, expect, it, vi } from 'vitest'
import { patchProp } from '../src/patchProp'

describe('runtime-dom/patchEvent', () => {
  it('should be patch', () => {
    const el = document.createElement('div')
    const fn = vi.fn()
    patchProp(el, 'onClick', null, fn)
    el.dispatchEvent(new Event('click'))
    el.dispatchEvent(new Event('click'))
    el.dispatchEvent(new Event('click'))
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('should update event handler', () => {
    const el = document.createElement('div')
    const prevFn = vi.fn()
    const nextFn = vi.fn()
    patchProp(el, 'onClick', null, prevFn)
    el.dispatchEvent(new Event('click'))
    patchProp(el, 'onClick', prevFn, nextFn)
    el.dispatchEvent(new Event('click'))
    el.dispatchEvent(new Event('click'))
    expect(prevFn).toHaveBeenCalledTimes(1)
    expect(nextFn).toHaveBeenCalledTimes(2)
  })

  it('should remove event handler', () => {
    const el = document.createElement('div')
    const fn = vi.fn()
    patchProp(el, 'onClick', null, fn)
    patchProp(el, 'onClick', fn, null)
    el.dispatchEvent(new Event('click'))
    el.dispatchEvent(new Event('click'))
    expect(fn).not.toHaveBeenCalled()
  })
})
