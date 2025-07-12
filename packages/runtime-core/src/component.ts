import type { VNode } from './vnode'
import { proxyRefs } from '@vue/reactivity'
import { isFunction } from '@vue/shared'
import { initProps, normalizePropsOptions } from './componentProps'

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
    setupState: null,
    // 用户声明的 props
    propsOptions: normalizePropsOptions(type.props),
    props: {},
    attrs: {},
    // 子树，render 的返回值
    subTree: null,
    // 是否已经挂载
    isMounted: false,
  }
  return instance
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

/**
 * 初始化组件状态
 * @param instance
 */
export function setupComponent(instance: ComponentInstance) {
  const { type } = instance

  // 初始化属性
  initProps(instance)

  if (isFunction(type.setup)) {
    const setupContext = createSetupContext(instance)
    // proxyRefs 解包 ref 不需要 .value
    const setupResult = proxyRefs(type.setup(instance.props, setupContext))
    // 获取 setup 返回的状态
    instance.setupState = setupResult
  }

  // 将 render 函数绑定给 instance
  instance.render = type.render
}
