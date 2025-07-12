import type { ComponentInstance } from './component'
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
 * 区分 props 和 attrs 上的属性
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
