import { hasChanged, isArray, isObject } from "@vue/shared";
import { track, trigger } from "./dep";
import { reactive } from "./reactive";
import { isRef } from "./ref";

export const mutableHandlers: ProxyHandler<any> = {
    get(target, key, receiver) {
        track(target, key)
        // receiver 保证访问器里的 this 指向代理对象
        // proxy === receiver
        const result = Reflect.get(target, key, receiver)

        // 如果是一个 ref，给他解包
        if (isRef(result)) {
            return result.value
        }

        // 嵌套的对象
        if (isObject(result)) {
            return reactive(result)
        }

        return result
    },
    set(target, key, newValue, receiver) {
        const oldValue = target[key]

        /**
         * 如果是数组，保留数组的 oldLength
         * 用来处理数组的隐式更新 length
         * 比如 arr.push()
         */
        const targetIsArray = isArray(target)
        const oldLength = targetIsArray ? target.length : 0

        /**
        * 如果是一个 ref，并且赋值的值不是一个 ref
        * const a = ref(0)
        * const target = { a }
        * target.a = 1
        */
        if (isRef(oldValue) && !isRef(newValue)) {
            oldValue.value = newValue
            return true
        }

        const result = Reflect.set(target, key, newValue, receiver)

        // 值改变了才触发更新
        if (hasChanged(target[key], oldValue)) {
            trigger(target, key)
        }

        /**
         * 触发数组的隐式更新
         * 如果 key === length 会走上面的 hasChanged，这里就没必要了
         */
        if (targetIsArray && target.length !== oldLength && key !== 'length') {
            trigger(target, 'length')
        }

        return result
    }
}