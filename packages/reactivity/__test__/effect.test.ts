import { describe, it, expect, vi } from "vitest";
import { ref, effect } from "../src/index";

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
})