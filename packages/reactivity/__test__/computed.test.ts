import { describe, expect, it, vi } from 'vitest'
import { computed, effect, ref } from '../src/index'

describe('reactivity/computed', () => {
  it('should return updated value', () => {
    const count = ref(1)
    const c = computed(() => count.value + 1)
    expect(c.value).toBe(2)
    count.value++
    expect(count.value).toBe(2)
    expect(c.value).toBe(3)
  })

  it('should compute lazily', () => {
    const count = ref(1)
    const getter = vi.fn(() => count.value + 1)
    const c = computed(getter)
    expect(getter).toBeCalledTimes(0)
    expect(c.value).toBe(2)
    expect(getter).toBeCalledTimes(1)

    c.value
    expect(getter).toBeCalledTimes(1)

    count.value++
    expect(getter).toBeCalledTimes(1)

    expect(c.value).toBe(3)
    expect(getter).toBeCalledTimes(2)
  })

  it('should trigger effect', () => {
    const count = ref(1)
    const c = computed(() => count.value)
    const fn = vi.fn(() => {
      c.value
    })
    effect(fn)
    expect(fn).toBeCalledTimes(1)
    count.value++
    expect(fn).toBeCalledTimes(2)
  })

  it('should work when chained', () => {
    const count = ref(1)
    const c1 = computed(() => count.value)
    const c2 = computed(() => c1.value + 1)
    expect(c2.value).toBe(2)
    expect(c1.value).toBe(1)
    count.value++
    expect(c2.value).toBe(3)
    expect(c1.value).toBe(2)
  })

  it('should trigger effect when chained', () => {
    const count = ref(1)
    const getter1 = vi.fn(() => count.value)
    const getter2 = vi.fn(() => {
      return c1.value + 1
    })
    const c1 = computed(getter1)
    const c2 = computed(getter2)

    const fn = vi.fn(() => {
      c2.value
    })

    effect(fn)
    expect(fn).toBeCalledTimes(1)
    expect(getter1).toBeCalledTimes(1)
    expect(getter2).toBeCalledTimes(1)
    count.value++
    expect(fn).toBeCalledTimes(2)
    expect(getter1).toBeCalledTimes(2)
    expect(getter2).toBeCalledTimes(2)
  })
})
