import type { VNode } from './vnode'
import { proxyRefs } from '@vue/reactivity'
import { hasOwn, isFunction, isObject } from '@vue/shared'
import { initProps, normalizePropsOptions } from './componentProps'
import { nextTick } from './scheduler'

export type Component = any

export type ComponentInstance = ReturnType<typeof createComponentInstance>

/**
 * 创建组件实例
 * @param vnode
 */
export function createComponentInstance(vnode: VNode) {
  const { type } = vnode
  const instance = {
    type,
    vnode,
    render: null,
    setupState: {},
    setupContext: null,
    proxy: null,
    ctx: null,
    // 用户声明的 props
    propsOptions: normalizePropsOptions(type.props),
    props: {},
    attrs: {},
    refs: {},
    slots: {},
    // 子树，render 的返回值
    subTree: null,
    // 是否已经挂载
    isMounted: false,
    update: null,
  }

  instance.ctx = { _: instance }
  return instance
}

/**
 * 初始化组件状态
 * @param instance
 */
export function setupComponent(instance: ComponentInstance) {
  // 初始化属性
  initProps(instance)
  // 处理组件状态
  setupStatefulComponent(instance)
}

const publicPropertiesMap = {
  $attrs: (instance: ComponentInstance) => instance.attrs,
  $slots: (instance: ComponentInstance) => instance.slots,
  $refs: (instance: ComponentInstance) => instance.refs,
  $nextTick: (instance: ComponentInstance) => nextTick.bind(instance),
  $forceUpdate: (instance: ComponentInstance) => {
    return () => instance.update()
  },
}

/**
 * 组件代理的公共 handlers
 */
const pubilcInstanceProxyHandlers: ProxyHandler<any> = {
  get(target, key) {
    const { _: instance } = target

    const { setupState, props } = instance

    /**
     * 处理 render 里访问 this.xxx
     * 指向 setupState 和 props
     */

    if (hasOwn(setupState, key)) {
      return setupState[key]
    }
    if (hasOwn(props, key)) {
      return props[key]
    }

    /**
     * $attrs
     * $slots
     * $refs
     * $nextTick
     */
    if (hasOwn(publicPropertiesMap, key)) {
      const publicGetter = publicPropertiesMap[key]
      return publicGetter(instance)
    }

    return instance[key]
  },
  set(target, key, newValue) {
    const { _: instance } = target

    const { setupState } = instance

    /**
     * 修改 setupState[key]
     * 组件的 props 不允许修改
     */
    if (hasOwn(setupState, key)) {
      return setupState[key] = newValue
    }

    return true
  },
}

/**
 * 处理组件状态
 * @param instance
 */
function setupStatefulComponent(instance: ComponentInstance) {
  const { type } = instance

  // 创建组件的代理 处理 this.$attrs | this.$refs 等
  instance.proxy = new Proxy(instance.ctx, pubilcInstanceProxyHandlers)

  if (isFunction(type.setup)) {
    // 创建 setup context
    const setupContext = createSetupContext(instance)
    instance.setupContext = setupContext
    // 调用 setup 函数
    const setupResult = type.setup(instance.props, setupContext)

    handleSetupResult(instance, setupResult)
  }

  // handleSetupResult 处理完了 instance 还是没有 render
  if (!instance.render) {
    // 将 render 函数绑定给 instance
    instance.render = type.render
  }
}

function handleSetupResult(instance: ComponentInstance, setupResult: any) {
  if (isFunction(setupResult)) {
    instance.render = setupResult
  }
  else if (isObject(setupResult)) {
    /**
     * 获取 setup 返回的状态
     * proxyRefs 解包 ref 不需要 .value
     */
    instance.setupState = proxyRefs(setupResult)
  }
}

/**
 * 创建 setup context
 * @param instance
 */
function createSetupContext(instance: ComponentInstance) {
  return {
    get attrs() {
      return instance.attrs
    },
  }
}
