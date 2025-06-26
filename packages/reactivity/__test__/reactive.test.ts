import { describe, it, expect, vi } from "vitest";
import { reactive, effect } from "../src/index";

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
            }
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
})