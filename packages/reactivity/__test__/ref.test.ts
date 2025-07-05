import { describe, expect, it, vi } from 'vitest'
import { effect, ref } from '../src/index'

describe('reactivity/ref', () => {
  it('should hold a value', () => {
    const a = ref(1)
    expect(a.value).toBe(1)
    a.value = 2
    expect(a.value).toBe(2)
  })

  it('should be reactivety', () => {
    const count = ref(1)
    const fn = vi.fn(() => {
      count.value
    })
    effect(fn)
    expect(count.value).toBe(1)
    expect(fn).toBeCalledTimes(1)
    count.value++
    expect(count.value).toBe(2)
    expect(fn).toBeCalledTimes(2)
  })

  it('should only be triggered when the value changes', () => {
    const count = ref(1)
    const fn = vi.fn(() => {
      count.value
    })
    effect(fn)
    expect(count.value).toBe(1)
    expect(fn).toBeCalledTimes(1)
    count.value = 1
    expect(fn).toBeCalledTimes(1)
  })
})
