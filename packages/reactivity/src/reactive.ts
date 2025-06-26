import { isObject } from "@vue/shared";
import { mutableHandlers } from "./baseHandlers";

export const targetMap = new WeakMap()
export const reactiveMap = new WeakMap()
const reactiveSet = new WeakSet()

export function reactive<T extends object>(target: T): T {
    return createReactiveObject(target)
}

function createReactiveObject<T extends object>(target: T): T {
    // 不是一个对象，直接返回
    if (!isObject(target)) {
        return target
    }

    // 处理已经是一个 proxy
    if (isReactive(target)) {
        return target
    }

    // 处理同一个对象被重复代理
    const existingProxy = reactiveMap.get(target)
    if (existingProxy) {
        return existingProxy
    }

    const porxy = new Proxy(target, mutableHandlers)

    // 保存 target 和 proxy 关联关系
    reactiveMap.set(target, porxy)
    // 保存所有 proxy
    reactiveSet.add(porxy)

    return porxy
}

export function isReactive(target: any) {
    return reactiveSet.has(target)
}
