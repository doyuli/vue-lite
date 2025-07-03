import { isFunction, isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { isRef } from "./ref";
import { isReactive } from "./reactive";

export interface WatchOptions {
    immediate?: boolean
    deep?: boolean | number
    once?: boolean
}

export type WacthCallback<T = any, O = any> = (newValue: T, oldValue: O, onCleanup: Function) => void

export function watch(source?: any, cb?: WacthCallback, options?: WatchOptions): () => void {
    let { immediate, deep, once } = options || {}

    let getter: Function
    let cleanup: Function

    if (once) {
        // once 实现
        const _cb = cb
        cb = (...args) => {
            _cb(...args)
            stop()
        }
    }

    if (isRef(source)) {
        getter = () => source.value
    } else if (isFunction(source)) {
        getter = source
    } else if (isReactive(source)) {
        if (!deep) {
            deep = true
        }
        getter = () => source
    }

    if (deep) {
        const baseGetter = getter
        const depth = deep === true ? Infinity : deep
        getter = () => traverse(baseGetter(), depth)
    }

    const effect = new ReactiveEffect(getter)

    function onCleanup(cb: Function) {
        cleanup = cb
    }

    let oldValue: any
    function job() {
        // 清除上一次的副作用
        if (cleanup) {
            cleanup()
            cleanup = undefined
        }
        // 收集依赖
        const newValue = effect.run()
        cb(newValue, oldValue, onCleanup)
        oldValue = newValue
    }

    effect.scheduler = job

    if (immediate) {
        // 立即执行
        job()
    } else {
        // 依赖收集 & oldValue
        oldValue = effect.run()
    }

    // 停止监听
    function stop() {
        effect.stop()
    }

    return stop
}

function traverse(value: unknown, depth = Infinity, seen = new Set()) {
    if (!isObject(value) || depth <= 0) {
        return value
    }

    // 防止循环引用
    if (seen.has(value)) {
        return value
    }

    seen.add(value)

    depth--

    for (const key in value) {
        traverse(value[key], depth, seen)
    }

    return value
}