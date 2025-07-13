import type { ComponentInstance } from './component'
import type { VNode } from './vnode'
import { reactive } from '@vue/reactivity'
import { hasOwn, isArray } from '@vue/shared'

/**
 * 标准化 props
 * 统一转换为对象
 * @param props
 */
export function normalizePropsOptions(props: any = {}) {
  if (isArray(props)) {
    return props.reduce((prev, cur: string) => {
      prev[cur] = {}
      return prev
    }, {})
  }

  return props
}

/**
 * 设置所有的 props 和 attrs
 * @param instance
 * @param rawProps
 * @param props
 * @param attrs
 */
function setFullProps(instance: ComponentInstance, rawProps: object, props: object, attrs: object) {
  if (rawProps) {
    const propsOptions = instance.propsOptions
    for (const key in rawProps) {
      const value = rawProps[key]
      if (hasOwn(propsOptions, key)) {
        props[key] = value
      }
      else {
        attrs[key] = value
      }
    }
  }
}

export function initProps(instance: ComponentInstance) {
  const { vnode } = instance
  // 用户传的 props
  const rawProps = vnode.props

  const props = {}
  const attrs = {}
  // 区分 props 和 attrs 上的属性
  setFullProps(instance, rawProps, props, attrs)

  // props 是响应式的，包一层
  instance.props = reactive(props)
  instance.attrs = attrs
}

export function updateProps(instance: ComponentInstance, nextVNode: VNode) {
  // 这里的 props 已经被 reactive 包一层了，是响应式的
  const { props, attrs } = instance
  // 这个 rawProps 不是响应式的，但是是最新的 props
  const rawProps = nextVNode.props
  // 设置所有 props 和 attrs
  setFullProps(instance, rawProps, props, attrs)

  /**
   * 删除之前有，现在没有的
   * props = { msg: 'hello world', age: 0 }
   * rawProps = { age: 0 }
   */
  for (const key in props) {
    // 最新的 rawProps 上没有这个属性
    if (!hasOwn(rawProps, key)) {
      delete props[key]
    }
  }

  for (const key in attrs) {
    // 最新的 rawProps 上没有这个属性
    if (!hasOwn(rawProps, key)) {
      delete attrs[key]
    }
  }
}
