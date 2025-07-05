import { describe, expect, it, vi } from 'vitest'
import { effect, reactive, ref } from '../src/index'

describe('reactivity/reactive', () => {
  it('should be reactivety', () => {
    const state = reactive({
      a: 1,
    })
    const fn = vi.fn(() => {
      state.a
    })
    effect(fn)
    expect(state.a).toBe(1)
    expect(fn).toBeCalledTimes(1)
    state.a++
    expect(fn).toBeCalledTimes(2)
  })

  it('should point to the correct', () => {
    const state = reactive({
      a: 1,
      get b() {
        return this.a
      },
    })
    const fn = vi.fn(() => {
      state.b
    })
    effect(fn)
    expect(state.b).toBe(1)
    expect(fn).toBeCalledTimes(1)
    state.a++
    expect(fn).toBeCalledTimes(2)
    expect(state.b).toBe(2)
  })

  it('should return the same proxy', () => {
    const obj = { a: 1 }
    const state1 = reactive(obj)
    const state2 = reactive(obj)
    const state3 = reactive(state1)

    expect(state1).toBe(state2)
    expect(state1).toBe(state3)
  })

  it('should only be triggered when the value changes', () => {
    const state = reactive({
      a: 1,
    })
    const fn = vi.fn(() => {
      state.a
    })
    effect(fn)
    expect(state.a).toBe(1)
    expect(fn).toBeCalledTimes(1)
    state.a = 1
    expect(fn).toBeCalledTimes(1)
  })

  it('should unref of the ref', () => {
    const count = ref(1) as any
    const state = reactive({
      count,
    })
    const fn = vi.fn(() => {
      state.count
    })
    effect(fn)
    expect(state.count).toBe(1)
    expect(fn).toBeCalledTimes(1)
    state.count = 2
    expect(state.count).toBe(2)
    expect(fn).toBeCalledTimes(2)
  })

  it('should handle nested objects', () => {
    const state = reactive({
      a: {
        b: 1,
      },
    })
    const fn = vi.fn(() => {
      state.a.b
    })
    effect(fn)
    expect(state.a.b).toBe(1)
    expect(fn).toBeCalledTimes(1)
    state.a.b++
    expect(state.a.b).toBe(2)
    expect(fn).toBeCalledTimes(2)
  })

  it('should be reactivety with array', () => {
    const state = reactive([1, 2, 3, 4])
    const fn = vi.fn(() => {
      state[0]
    })
    effect(fn)
    expect(state[0]).toBe(1)
    expect(fn).toBeCalledTimes(1)
    state[0]++
    expect(fn).toBeCalledTimes(2)
    expect(state[0]).toBe(2)
  })

  it('should be updated when the array length changes', () => {
    const state = reactive([1, 2, 3, 4])
    const fn = vi.fn(() => {
      state[2]
    })
    const lengthFn = vi.fn(() => {
      state.length
    })
    effect(fn)
    effect(lengthFn)
    expect(fn).toBeCalledTimes(1)
    expect(lengthFn).toBeCalledTimes(1)
    state.length = 2
    expect(fn).toBeCalledTimes(2)
    expect(lengthFn).toBeCalledTimes(2)
    expect(state[2]).toBe(undefined)
  })

  it('should implicit update with array', () => {
    const state = reactive([1, 2, 3, 4])
    const fn = vi.fn(() => {
      state.length
    })
    effect(fn)
    expect(fn).toBeCalledTimes(1)
    state.push(5)
    expect(fn).toBeCalledTimes(2)
    state.shift()
    expect(fn).toBeCalledTimes(3)
    expect(state).toEqual([2, 3, 4, 5])
  })
})
