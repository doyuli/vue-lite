import type { RendererOptions } from '@vue/runtime-core'

export const nodeOps: Omit<RendererOptions<Node, Element>, 'patchProp'> = {
  insert: (child, parent, anchor) => {
    /** insertBefore 如果第二个参数为 null，那它就等于 appendChild */
    parent.insertBefore(child, anchor || null)
  },

  remove: (child) => {
    const parent = child.parentNode
    if (parent) {
      parent.removeChild(child)
    }
  },

  createElement: (tag): Element => {
    return document.createElement(tag)
  },

  createText: text => document.createTextNode(text),

  /** 创建注释节点 */
  createComment: text => document.createComment(text),

  setText: (node, text) => {
    node.nodeValue = text
  },

  setElementText: (el, text) => {
    el.textContent = text
  },

  parentNode: node => node.parentNode as Element | null,

  /** 获取下一个兄弟节点 */
  nextSibling: node => node.nextSibling,

  querySelector: selector => document.querySelector(selector),
}
