import { describe, expect, it, vi } from 'vitest'
import { effect, ref } from '../src/index'

describe('reactivity/effect', () => {
  it('should be reactivity', () => {
    const count = ref(1)
    let state: number

    const fn = vi.fn(() => {
      state = count.value
    })
    effect(fn)
    expect(fn).toBeCalledTimes(1)
    expect(state).toBe(1)

    count.value++
    expect(fn).toBeCalledTimes(2)
    expect(state).toBe(2)
  })

  it('should allow nested logic', () => {
    const count = ref(1)
    let state: number
    const innerFn = vi.fn(() => {
      state = count.value
    })
    const fn = vi.fn(() => {
      effect(innerFn)
      state = count.value
    })
    effect(fn)
    expect(innerFn).toBeCalledTimes(1)
    expect(fn).toBeCalledTimes(1)

    count.value++
    expect(state).toBe(2)
    expect(innerFn).toBeCalledTimes(3)
    expect(fn).toBeCalledTimes(2)
  })

  it('should collect dependencies correctly', () => {
    const falg = ref(true)
    const count = ref(0)
    const fn = vi.fn(() => {
      falg.value
      count.value
    })
    effect(fn)
    expect(fn).toBeCalledTimes(1)
    count.value++
    expect(fn).toBeCalledTimes(2)
    count.value++
    expect(fn).toBeCalledTimes(3)
    count.value++
    expect(fn).toBeCalledTimes(4)
  })

  it('should discover new branches while running automatically', () => {
    const falg = ref(true)
    const flagTrue = ref(0)
    const flagFalse = ref(0)
    const fn = vi.fn(() => {
      if (falg.value) {
        flagTrue.value
      }
      else {
        flagFalse.value
      }
    })
    effect(fn)
    expect(fn).toBeCalledTimes(1)
    falg.value = false
    expect(fn).toBeCalledTimes(2)
    flagTrue.value++
    expect(fn).toBeCalledTimes(2)
    flagFalse.value++
    expect(fn).toBeCalledTimes(3)
  })

  it('should automatically clean up when no dependencies are found', () => {
    const count = ref(0)
    let flag = false
    const fn = vi.fn(() => {
      if (flag)
        return
      flag = true
      count.value
    })
    effect(fn)
    expect(fn).toBeCalledTimes(1)
    count.value++
    expect(fn).toBeCalledTimes(2)
    count.value++
    expect(fn).toBeCalledTimes(2)
  })

  it('should handle recursive loops', () => {
    const count = ref(0)
    const fn = vi.fn(() => {
      count.value++
    })
    effect(fn)
    expect(fn).toBeCalledTimes(1)
    count.value++
    expect(fn).toBeCalledTimes(2)
    count.value++
    expect(fn).toBeCalledTimes(3)
  })

  it('should avoid collecting the same', () => {
    const count = ref(0)
    const fn = vi.fn(() => {
      count.value
      count.value
    })
    effect(fn)
    expect(fn).toBeCalledTimes(1)
    count.value++
    expect(fn).toBeCalledTimes(2)
  })

  it('should be stoped', () => {
    const count = ref(0)
    const fn = vi.fn(() => {
      count.value
    })
    const e = effect(fn)
    expect(fn).toBeCalledTimes(1)
    count.value++
    expect(fn).toBeCalledTimes(2)
    e.effect.stop()
    count.value++
    expect(count.value).toBe(2)
    expect(fn).toBeCalledTimes(2)
  })
})
