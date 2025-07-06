import { isArray, isString, ShapeFlags } from '@vue/shared'

export function createVNode(type: string, props?: any, children?: any) {
  let shapeFlag: number

  if (isString(type)) {
    /**
     * dom 元素 1
     */
    shapeFlag = ShapeFlags.ELEMENT
  }

  if (isString(children)) {
    /**
     * 纯文本子元素 二进制1001
     * 等价于 shapeFlag = shapeFlag | ShapeFlags.TEXT_CHILDREN
     * 或运算（二进制）
     * 0001 位数不够，shapeFlag 前面补零
     * 1000
     */
    shapeFlag |= ShapeFlags.TEXT_CHILDREN
  }
  else if (isArray(children)) {
    /**
     * 数组形式子节点 二进制10001
     */
    shapeFlag |= ShapeFlags.ARRAY_CHILDREN
  }

  const vnode = {
    __v_isVNode: true,
    type,
    props,
    children,
    // 做 diff 用的
    key: props?.key,
    // 虚拟节点要挂载的元素
    el: null,
    appContext: null,
    shapeFlag,
  }

  return vnode
}

export function isVNode(vlaue: any) {
  return vlaue?.__v_isVNode
}
