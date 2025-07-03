import { Link, link, propagate } from "./system";
import { activeSub } from "./effect";
import { targetMap } from "./reactive";
import { isArray } from "@vue/shared";

export class Dep {
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

    if (isArray(target) && key === 'length') {
        /**
         * 更新数组 length
         * const arr = [1,2,3,4]
         * arr.length = 2  =>  arr = [1,2]
         * 通知 3,4 的 effect 重新执行
         */
        const length = target.length
        depsMap.forEach((dep, depKey: unknown) => {
            /**
             * 通知访问了 length 属性或者下标大于 length - 1 的 effect 重新执行
             * effect(() => arr.length)
             */
            if (depKey as number >= length || depKey === 'length') {
                propagate(dep.subs)
            }
        })
    }
    else {
        const dep = depsMap.get(key)
        if (!dep) return

        propagate(dep.subs)
    }


}