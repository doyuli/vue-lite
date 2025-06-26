import { hasChanged } from "@vue/shared";
import { track, trigger } from "./dep";

export const mutableHandler: ProxyHandler<any> = {
    get(target, key, receiver) {
        track(target, key)
        // receiver 保证访问器里的 this 指向代理对象
        // proxy === receiver
        return Reflect.get(target, key, receiver)
    },
    set(target, key, newValue, receiver) {
        const oldValue = target[key]
        const result = Reflect.set(target, key, newValue, receiver)
        if (hasChanged(target[key], oldValue)) {
            trigger(target, key)
        }
        return result
    }
}