import type { VNodeTypes } from './vnode'
import { isArray, isObject } from '@vue/shared'
import { createVNode, isVNode } from './vnode'

/**
 * h 函数的使用方法：
 * 1. h('div', 'hello world') 第二个参数为 子节点
 * 2. h('div', [h('span', 'hello'), h('span', ' world')]) 第二个参数为 子节点
 * 3. h('div', h('span', 'hello')) 第二个参数为 子节点
 * 4. h('div', { class: 'container' }) 第二个参数是 props
 * ------
 * 5. h('div', { class: 'container' }, 'hello world')
 * 6. h('div', { class: 'container' }, h('span', 'hello world'))
 * 7. h('div', { class: 'container' }, h('span', 'hello'), h('span', 'world'))
 * 8. h('div', { class: 'container' },[h('span', 'hello'), h('span', 'world')]) 和 7 一个意思
 *
 * @param type
 * @param propsOrChildren
 * @param children
 */
export function h(type: VNodeTypes, propsOrChildren?: any, children?: any) {
  const l = arguments.length

  if (l === 2) {
    if (isArray(propsOrChildren)) {
      // h('div', [h('span', 'hello'), h('span', ' world')])
      return createVNode(type, null, propsOrChildren)
    }

    if (isObject(propsOrChildren)) {
      if (isVNode(propsOrChildren)) {
        // h('div', h('span', 'hello'))
        return createVNode(type, null, [propsOrChildren])
      }
      // h('div', { class: 'container' })
      return createVNode(type, propsOrChildren)
    }
    // h('div', 'hello world')
    return createVNode(type, null, propsOrChildren)
  }
  else {
    if (l > 3) {
      /**
       * h('div', { class: 'container' }, h('span', 'hello'), h('span', 'world'))
       * 转换成
       * h('div', { class: 'container' }, [h('span', 'hello'), h('span', 'world')])
       */
      children = Array.prototype.slice.call(arguments, 2)
    }
    else if (l === 3 && isVNode(children)) {
      // h('div', { class: 'container' }, h('span', 'hello world'))
      children = [children]
    }

    return createVNode(type, propsOrChildren, children)
  }
}
