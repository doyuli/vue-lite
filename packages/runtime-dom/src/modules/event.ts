/**
 * 创建事件处理函数
 * @param value
 * @returns
 */
function createInvoker(value: Function) {
  /**
   * 调用 invoker.value 来处理事件
   * 更新事件函数只需要重新赋值 invoker.value
   * @param e
   */
  const invoker = (e: Event) => {
    invoker.value(e)
  }
  invoker.value = value

  return invoker
}

const veiKey: unique symbol = Symbol('_vei')

export function patchEvent(el: Element, rawName: string, nextValue: EventListener) {
  // onClick => clikc
  const name = rawName.slice(2).toLowerCase()
  // 获取 el 上的事件处理 map
  const invokers = el[veiKey] ??= {}
  // 获取之前绑定的 invoker
  const existingInvoker = invokers[rawName]
  if (nextValue) {
    if (existingInvoker) {
      existingInvoker.value = nextValue
    }
    else {
      const invoker = createInvoker(nextValue)
      // 保存到 el 上的事件处理 map
      invokers[rawName] = invoker
      el.addEventListener(name, invoker)
    }
  }
  // 移除旧的事件
  else if (existingInvoker) {
    el.removeEventListener(name, existingInvoker)
    invokers[rawName] = undefined
  }
}
