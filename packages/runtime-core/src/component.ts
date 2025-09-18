import type { VNode } from './vnode'
import { proxyRefs } from '@vue/reactivity'
import { hasOwn, isFunction, isObject } from '@vue/shared'
import { initProps, normalizePropsOptions } from './componentProps'
import { initSlots } from './componentSlots'
import { nextTick } from './scheduler'

export type Component = any

export type ComponentInstance = ReturnType<typeof createComponentInstance>

/**
 * 创建组件实例
 * @param vnode
 */
export function createComponentInstance(vnode: VNode, parent: any) {
  const { type } = vnode

  const appContext = parent ? parent.appContext : vnode.appContext

  const instance = {
    /**
     * 组件的类型定义（type）
     * - 函数式组件：函数本身
     * - 普通组件：组件的配置对象（即 defineComponent 返回的对象）
     * - 异步组件：异步加载函数
     */
    type,
    /**
     * 当前组件对应的 VNode
     * 在 patch 过程中用于对比新旧 vnode，驱动更新
     */
    vnode,
    /**
     * 应用上下文（App Context）
     * 从根组件继承而来，包含全局共享的数据和配置，例如：
     * - 全局注册的组件（app.component()）
     * - 全局注册的指令（app.directive()）
     * - 全局 mixin、插件
     * - 自定义的全局 API（通过 app.config.globalProperties）
     * - 自定义的 provide/inject 链
     *
     * 每个组件实例通过 instance.appContext 访问这些全局资源
     * 在组件解析、渲染、依赖注入等过程中被频繁使用
     *
     * 注意：子组件继承父组件的 appContext，通常在应用初始化时创建
     */
    appContext,
    /**
     * 用户定义的 render 函数
     * 可以是模板编译后的函数，也可以是用户手写的 render 函数
     * 在 setup() 返回函数时，该函数会被赋值给 render
     */
    render: null,
    /**
     * setup() 函数的返回值（响应式对象），用于存储 setup 中返回的响应式数据、方法等
     * 通过 proxyRefs 处理，使得 ref 自动解包
     */
    setupState: {},
    /**
     * setup() 函数的第二个参数：setupContext
     * 包含 emit、attrs、slots、expose 四个属性
     */
    setupContext: null,
    /**
     * 组件实例的代理对象（this）
     * 即用户在 setup 中访问的 `this`，代理了 props、setupState 等
     */
    proxy: null,
    /**
     * 组件的上下文对象（ctx）
     * 包含一些运行时方法和属性，如 $attrs, $slots, $emit 等
     * 是 proxy 的底层实现之一，不推荐直接使用
     */
    ctx: null,
    /**
     * 解析后的 props 选项
     * 格式化为 { [key: string]: PropOptions } 的形式
     * 用于后续 props 的校验、默认值处理等
     */
    propsOptions: normalizePropsOptions(type.props),
    /**
     * 当前组件接收到的 props 数据（经过响应式处理）
     * 来源于父组件传递的 props
     */
    props: {},
    /**
     * 未被声明为 props 的 attribute（即“透传 attribute”）
     * 例如父组件传了 <Child title="hello" data-id="123" />，但 Child 没声明 data-id
     * 那么 data-id 会进入 attrs
     */
    attrs: {},
    /**
     * 存储通过 ref 命名的 DOM 元素或子组件引用
     * 例如：setup 中使用 const el = ref()，模板中 ref="el"
     * 挂载后会将真实 DOM 或组件实例赋值给 instance.refs.el
     */
    refs: {},
    /**
     * 解析后的插槽内容（slots）
     * 存储从父组件传递进来的插槽 VNode
     * 例如：父组件使用 <template #header>...</template>，子组件通过 slots.header 访问
     */
    slots: {},
    /**
     * 当前组件的渲染子树（render subtree）
     * 即 render() 函数执行后返回的 VNode 树
     * 在 patch 阶段用于对比更新
     */
    subTree: null,
    /**
     * 标记组件是否已经完成首次挂载
     */
    isMounted: false,
    /**
     * 组件的副作用更新函数（effect runner）
     * 由 effect(() => componentUpdate()) 创建
     * 负责组件的重新渲染（即触发 render -> patch）
     */
    update: null,
    /**
     * 缓存下一个版本的 vnode（下一次更新的 vnode）
     * 在组件更新前设置，用于在更新过程中对比新旧 vnode
     * 更新完成后会被赋值给 instance.vnode
     */
    next: null,
    /**
     * 用于触发自定义事件的函数
     * 用户通过 emit('event', payload) 触发事件
     */
    emit: null,
    /**
     * 用户调用 expose() 显式暴露的对象
     * 用于控制哪些属性/方法可以通过模板 ref 或 $refs 访问
     * 例如：expose({ open, close })
     */
    exposed: null,
    /**
     * exposed 对象的代理
     * 支持自动解包 ref，并暴露 $el, $refs, $slots 等公共属性
     * 是 ref.value 访问时实际返回的对象
     */
    exposedProxy: null,
    /**
     * 父组件实例
     */
    parent,
    /**
     * 子组件实例树的集合（用于父子通信、卸载等）
     */
    children: new Set(),
  }

  instance.ctx = { _: instance }

  // 事件处理函数
  // instance.emit = (event: string, ...args: any[]) => emit(instance, event, ...args)
  instance.emit = emit.bind(null, instance) // 和上面注释一样的效果

  return instance
}

/**
 * 初始化组件状态
 * @param instance
 */
export function setupComponent(instance: ComponentInstance) {
  // 初始化属性
  initProps(instance)
  // 初始化插槽
  initSlots(instance)
  // 处理组件状态
  setupStatefulComponent(instance)
}

const publicPropertiesMap = {
  $el: (instance: ComponentInstance) => instance.vnode.el,
  $attrs: (instance: ComponentInstance) => instance.attrs,
  $slots: (instance: ComponentInstance) => instance.slots,
  $refs: (instance: ComponentInstance) => instance.refs,
  $emit: (instance: ComponentInstance) => instance.emit,
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

    // 保存当前实例
    setCurrentInstance(instance)

    // 调用 setup 函数
    const setupResult = type.setup(instance.props, setupContext)

    // 清除当前实例
    unsetCurrentInstance()

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
    emit(event: string, ...args: any[]) {
      emit(instance, event, ...args)
    },
    slots: instance.slots,
    expose(exposed: Record<string, any>) {
      // 把用户传递的对象，保存到当前实例上
      instance.exposed = exposed
    },
  }
}

/**
 * 事件处理函数
 * instance 上也要用，抽出来
 * @param instance
 * @param event
 * @param args
 */
function emit(instance: ComponentInstance, event: string, ...args: any[]) {
  // foo => onFoo
  const eventName = `on${event[0].toUpperCase() + event.slice(1)}`
  // 事件处理函数
  const handler = instance.vnode.props[eventName]
  if (isFunction(handler)) {
    handler?.(...args)
  }
}

/**
 * 获取组件公开的属性
 * @param instance
 */
export function getComponentPublicInstance(instance: ComponentInstance) {
  if (instance.exposed) {
    // 手动调用过 component.expose()
    if (!instance.exposedProxy) {
      // proxyRefs 自动解包 ref
      instance.exposedProxy = new Proxy(proxyRefs(instance.exposed), {
        get(target, key) {
          if (key in target) {
            return target[key]
          }

          if (key in publicPropertiesMap) {
          // $el $slots $attrs...
            return publicPropertiesMap[key](instance)
          }
        },
      })
    }

    return instance.exposedProxy
  }
  // 如果没有手动暴露，返回代理对象
  return instance.proxy
}

/**
 * 当前组件实例
 */
let currentInstance: ComponentInstance | null = null

export function setCurrentInstance(instance: ComponentInstance) {
  currentInstance = instance
}

export function getCurrentInstance() {
  return currentInstance
}

export function unsetCurrentInstance() {
  currentInstance = null
}

/**
 * 当前正在渲染的组件实例
 */
let currentRenderingInstance: ComponentInstance | null = null

export function setCurrentRenderingInstance(instance: ComponentInstance) {
  currentRenderingInstance = instance
}

export function getCurrentRenderingInstance() {
  return currentRenderingInstance
}

export function unsetCurrentRenderingInstance() {
  currentRenderingInstance = null
}
