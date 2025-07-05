import { describe, expect, it, vi } from 'vitest'
import { reactive, ref, watch } from '../src/index'

describe('reactivity/watch', () => {
  it('should be watch with ref', () => {
    const count = ref(0)
    const cb = vi.fn()
    watch(count, cb)
    expect(cb).toHaveBeenCalledTimes(0)
    count.value++
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith(1, 0, expect.any(Function))
    count.value++
    expect(cb).toHaveBeenCalledTimes(2)
    expect(cb).toHaveBeenCalledWith(2, 1, expect.any(Function))
  })

  it('should be watch with reactive', () => {
    const state = reactive({
      count: 1,
    })
    const cb = vi.fn()
    watch(state, cb)
    expect(cb).toHaveBeenCalledTimes(0)
    state.count++
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('should watch a getter function', () => {
    const state = reactive({ count: 0 })
    const callback = vi.fn()

    watch(() => state.count, callback)
    expect(callback).not.toHaveBeenCalled()

    state.count++
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(1, 0, expect.any(Function))
  })

  it('should support immediate option', () => {
    const count = ref(0)
    const callback = vi.fn()

    watch(count, callback, { immediate: true })
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(0, undefined, expect.any(Function))
  })

  it('should support deep option for reactive objects', () => {
    const state = reactive({ nested: { count: 0 } })
    const callback = vi.fn()

    watch(state, callback, { deep: true })
    expect(callback).not.toHaveBeenCalled()

    state.nested.count++
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should support custom depth for deep watching', () => {
    const state = reactive({ level1: { level2: { level3: { count: 0 } } } })
    const callback = vi.fn()

    watch(state, callback, { deep: 2 })

    state.level1.level2.level3.count++
    expect(callback).not.toHaveBeenCalled()

    state.level1.level2 = { level3: { count: 1 } }
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should support once option', () => {
    const count = ref(0)
    const callback = vi.fn()

    watch(count, callback, { once: true })

    count.value++
    expect(callback).toHaveBeenCalledTimes(1)

    count.value++
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should provide cleanup function', () => {
    const count = ref(0)
    const cleanup = vi.fn()
    const callback = vi.fn((_, __, onCleanup) => {
      onCleanup(cleanup)
    })

    watch(count, callback, { immediate: true })

    count.value++
    expect(cleanup).toHaveBeenCalledTimes(1)

    count.value++
    expect(cleanup).toHaveBeenCalledTimes(2)
  })

  it('should stop watching when stop function is called', () => {
    const count = ref(0)
    const callback = vi.fn()

    const stop = watch(count, callback)
    count.value++
    expect(callback).toHaveBeenCalledTimes(1)

    stop()
    count.value++
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should handle circular references in deep watching', () => {
    const obj = reactive({ self: null as any })
    obj.self = obj

    const callback = vi.fn()

    expect(() => {
      watch(obj, callback, { deep: true })
      obj.self = { nested: obj }
    }).not.toThrow()

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should traverse arrays in deep watching', () => {
    const arr = reactive([{ value: 1 }, { value: 2 }])
    const callback = vi.fn()

    watch(arr, callback, { deep: true })
    arr[0].value = 3
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should not trigger for non-deep changes when not using deep option', () => {
    const state = reactive({ nested: { count: 0 } })
    const callback = vi.fn()

    watch(state, callback)
    state.nested.count++
    expect(callback).toHaveBeenCalledTimes(1)

    state.nested = { count: 1 }
    expect(callback).toHaveBeenCalledTimes(2)
  })
})
