import { Link, link, propagate } from "./system";
import { activeSub } from "./effect";
import { targetMap } from "./reactive";

class Dep {
    subs: Link | undefined
    subsTail: Link | undefined
    constructor() { }
}

/**
 * 建立依赖关系
 */
export function track(target: Object, key: any) {
    if (!activeSub) return

    let depsMap = targetMap.get(target)
    if (!depsMap) {
        depsMap = new Map()
        targetMap.set(target, depsMap)
    }

    let dep = depsMap.get(key)
    if (!dep) {
        dep = new Dep()
        depsMap.set(key, dep)
    }

    link(dep, activeSub)
}

/**
 * 触发更新
 */
export function trigger(target: Object, key: any) {
    const depsMap = targetMap.get(target)
    if (!depsMap) return

    const dep = depsMap.get(key)
    if (!dep) return

    propagate(dep.subs)
}