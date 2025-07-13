import type { ComponentInstance } from './component'
import type { VNode } from './vnode'
import { ReactiveEffect } from '@vue/reactivity'
import { ShapeFlags } from '@vue/shared'
import { createAppAPI } from './apiCreateApp'
import { createComponentInstance, setupComponent } from './component'
import { queueJob } from './scheduler'
import { isSameVNodeType, normalizeVNode, Text } from './vnode'

/**
 * 创建渲染器
 * @param options
 */
export function createRenderer(options: RendererOptions) {
  // 操作 dom 方法
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
  } = options

  /**
   * 卸载子节点
   * @param children
   */
  const unmountChildren = (children: VNode['children']) => {
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      // 递归卸载子节点
      unmount(child)
    }
  }

  /**
   * 卸载
   * @param vnode
   */
  const unmount = (vnode: VNode) => {
    const { shapeFlag, children } = vnode
    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 递归卸载子节点
      unmountChildren(children)
    }
    hostRemove(vnode.el)
  }

  /**
   * 挂载子节点
   * @param children
   * @param el
   */
  const mountChildren = (children: VNodeChildren, el: RendererElement) => {
    for (let i = 0; i < children.length; i++) {
      // 标准化 vnode
      const child = children[i] = normalizeVNode(children[i])
      // 递归挂载子节点
      patch(null, child, el)
    }
  }

  /**
   * 挂载
   * @param vnode
   * @param container
   */
  const mountElement = (vnode: VNode, container: RendererElement, anchor: RendererElement = null) => {
    const { type, props, children, shapeFlag } = vnode

    // 创建 dom 元素
    const el = hostCreateElement(type)
    // 更新、卸载时需要用到
    vnode.el = el

    // 设置 props
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }

    /**
     * 挂载子节点
     * 与运算（二进制）
     */
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 文本子节点
      hostSetElementText(el, children)
    }
    else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 数组子节点
      mountChildren(children, el)
    }

    // 把 el 挂载到 container 中
    hostInsert(el, container, anchor)
  }

  /**
   * 更新 props
   * @param el
   */
  const patchProps = (el: RendererElement, oldProps: any, newProps: any) => {
    // 删掉老的
    if (oldProps) {
      for (const key in oldProps) {
        hostPatchProp(el, key, oldProps[key], null)
      }
    }

    // 设置新的
    if (newProps) {
      for (const key in newProps) {
        hostPatchProp(el, key, oldProps?.[key], newProps[key])
      }
    }
  }

  /**
   * 更新子节点
   * @param n1
   * @param n2
   */
  const patchChildren = (n1: VNode, n2: VNode) => {
    const prevShapeFlag = n1.shapeFlag
    const nextShapeFlag = n2.shapeFlag
    const el = n2.el
    /**
     * 这里分为几种情况
     * 1. 新的是文本
     *  1.1 旧的是数组
     *  1.2 旧的也是文本
     *  1.3 旧的是null
     * 2. 新的是数组
     *  2.1 旧的是文本
     *  2.2 旧的也是数组
     *  2.3 旧的是null
     */
    // 新的是文本
    if (nextShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 旧的是数组 则要卸载旧的
        unmountChildren(n1.children)
      }
      // 旧的也是文本，替换文本
      if (n1.children !== n2.children) {
        // 设置文本
        hostSetElementText(el, n2.children)
      }
    }
    // 新的是数组 或者 null
    else {
      // 旧的是文本
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(el, '')
        if (nextShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 挂载新的节点
          mountChildren(n2.children, el)
        }
      }
      // 老的是数组
      else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (nextShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 新的是数组，老的也是数组 全量 diff
          patchKeyedChildren(n1.children, n2.children, el)
        }
        else {
          // 老的是数组，新的是 null
          unmountChildren(n1.children)
        }
      }
      // 老的是 null
      else {
        // 新的是数组，挂载新的
        if (nextShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(n2.children, el)
        }
      }
    }
  }

  /**
   * 全量 diff
   * @param c1
   * @param c2
   * @param container
   */
  const patchKeyedChildren = (c1: VNodeChildren, c2: VNodeChildren, container: RendererElement) => {
    // 双端 diff
    let i = 0
    let e1 = c1.length - 1
    let e2 = c2.length - 1

    /**
     * 头部对比
     * c1 => [a,b]
     * c2 => [a,b,c]
     * 开始时：i = 0, e1 = 1, e2 = 2
     * 结束时：i = 2, e1 = 1, e2 = 2
     */
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = (c2[i] = normalizeVNode(c2[i]))
      if (isSameVNodeType(n1, n2)) {
        // 如果 n1 和 n2 是同一个类型节点，则更新
        patch(n1, n2, container)
      }
      else {
        break
      }
      i++
    }

    /**
     * 尾部对比
     * c1 => [a,b]
     * c2 => [c,a,b]
     * 开始时：i = 0, e1 = 1, e2 = 2
     * 结束时：i = 0, e1 = -1, e2 = 0
     */
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = (c2[e2] = normalizeVNode(c2[e2]))
      if (isSameVNodeType(n1, n2)) {
        // 如果 n1 和 n2 是同一个类型节点，则更新
        patch(n1, n2, container)
      }
      else {
        break
      }
      // 更新尾指针
      e1--
      e2--
    }

    if (i > e1) {
      // 表示老的少，新的多，要挂载新的，挂载范围为 i-e2
      const nextPos = e2 + 1
      // 拿到它后面的一个元素，insertBefore 插入
      const anchor = nextPos < c2.length ? c2[nextPos].el : null
      while (i <= e2) {
        // 挂载
        patch(null, (c2[i] = normalizeVNode(c2[i])), container, anchor)
        i++
      }
    }
    else if (i > e2) {
      // 表示老的多，新的少，要卸载老的，卸载返回 i-e1
      while (i <= e1) {
        unmount(c1[i])
        i++
      }
    }
    else {
      /**
       * 乱序 diff
       * 找到相同 key 的 vnode 进行 patch
       *
       * c1 => [a, (b, c, d), e]
       * c2 => [a, (c, d, b), e]
       * 开始时：i = 0, e1 = 4, e2 = 4
       * 双端对比完：i = 1, e1 = 3, e2 = 3
       */

      const s1 = i
      const s2 = i

      // 记录新旧节点下标的映射关系，求最长递增子序列
      const newIndexToOldIndexMap: number[] = Array.from({ length: e2 - s2 + 1 })
      // -1 代表不需要计算
      newIndexToOldIndexMap.fill(-1)

      /**
       * 遍历新节点 s2-e2 乱序区间
       * 储存新子节点的 key 和 index 的映射关系
       * c => 1, d => 2, b => 3
       */
      const keyToNewIndexMap = new Map()
      for (let j = s2; j <= e2; j++) {
        const n2 = (c2[j] = normalizeVNode(c2[j]))
        keyToNewIndexMap.set(n2.key, j)
      }

      // 临时储存下标，看看是不是递增的，是的话就不需要计算最长递增子序列
      let pos = -1
      // 是否需要移动，计算最长递增子序列
      let moved = false

      /**
       * 遍历旧节点 s1-e1 乱序区间
       * 找到相同 key 的 vnode 进行 patch
       * 否则进行卸载
       */
      for (let j = s1; j <= e1; j++) {
        const n1 = c1[j]
        // 找到旧节点 key 对应的新节点下标
        const newIndex = keyToNewIndexMap.get(n1.key)
        if (newIndex) {
          // 判断当前节点下标是否是递增的
          if (newIndex > pos) {
            pos = newIndex
          }
          else {
            // 需要计算最长递增子序列
            moved = true
          }

          // 建立新旧节点的 index 关联关系
          newIndexToOldIndexMap[newIndex] = j

          // 更新
          patch(n1, c2[newIndex], container)
        }
        else {
          unmount(n1)
        }
      }

      // 求最长递增子序列
      const newIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : []
      // set.has 性能比 arr.includes 好
      const sequenceSet = new Set(newIndexSequence)

      /**
       * 遍历新节点，调整顺序
       * 倒序插入 因为插入方法底层是 el.insertBefore()
       */
      for (let j = e2; j >= s2; j--) {
        // 当前 vnode
        const n2 = c2[j]
        // 它后面的一个元素
        const anchor = c2[j + 1]?.el || null
        if (n2.el) {
          // 有 vnode.el,说明之前 patch 过，调整顺序
          if (moved && !sequenceSet.has(j)) {
            // 不在最长递增子序列才需要移动
            hostInsert(n2.el, container, anchor)
          }
        }
        else {
          // 没有则说明是新元素，挂载
          patch(null, n2, container, anchor)
        }
      }
    }
  }

  /**
   * 更新节点
   * @param n1
   * @param n2
   */
  const patchElement = (n1: VNode, n2: VNode) => {
    // 复用 dom 元素
    const el = (n2.el = n1.el)
    // 更新 props
    patchProps(el, n1.props, n2.props)
    // 更新 children
    patchChildren(n1, n2)
  }

  /**
   * dom 的挂载、更新
   * @param n1
   * @param n2
   * @param container
   * @param anchor
   */
  const processElement = (n1: VNode, n2: VNode, container: RendererElement, anchor: RendererElement = null) => {
    if (n1 == null) {
      // 挂载
      mountElement(n2, container, anchor)
    }
    else {
      // 更新
      patchElement(n1, n2)
    }
  }

  /**
   * 文本的挂载、更新
   * @param n1
   * @param n2
   * @param container
   * @param anchor
   */
  const processText = (n1: VNode, n2: VNode, container: RendererElement, anchor: RendererElement = null) => {
    if (n1 == null) {
      // 挂载
      const el = hostCreateText(n2.children)
      n2.el = el
      // 把 el 挂载到 container 中
      hostInsert(el, container, anchor)
    }
    else {
      // 更新
      n2.el = n1.el
      if (n1.children !== n2.children) {
        hostSetText(n2.el, n2.children)
      }
    }
  }

  /**
   * render effect
   * @param instance
   * @param container
   * @param anchor
   */
  const setupRenderEffect = (instance: ComponentInstance, container: RendererElement, anchor: RendererElement = null) => {
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        // 获取 subTree，this 指向 instance 的代理对象
        const subTree = instance.render.call(instance.proxy)
        // 将 subTree 挂载在页面
        patch(null, subTree, container, anchor)
        // 保留上一次的 subTree，更新用
        instance.subTree = subTree
        // 标记挂载
        instance.isMounted = true
      }
      else {
        // 已经挂载，需要更新
        const prevSubTree = instance.subTree
        const subTree = instance.render.call(instance.proxy)
        patch(prevSubTree, subTree, container, anchor)
        // 保留上一次的 subTree，下次更新用
        instance.subTree = subTree
      }
    }

    // 创建 effect
    const effect = new ReactiveEffect(componentUpdateFn)
    const update = effect.run.bind(effect)

    // 保存 effect.run 到实例上, $forceUpdate 实现
    instance.update = update
    // 重写 scheduler
    effect.scheduler = () => {
      /**
       * 重写 effect 的 scheduler
       * 异步更新
       */
      queueJob(update)
    }

    // 首次渲染，收集依赖
    update()
  }

  /**
   * 组件的挂载
   * @param vnode
   * @param container
   * @param anchor
   */
  const mountComponent = (vnode: VNode, container: RendererElement, anchor: RendererElement = null) => {
    // 创建组件实例
    const instance = createComponentInstance(vnode)
    // 初始化组件状态
    setupComponent(instance)
    // effect
    setupRenderEffect(instance, container, anchor)
  }

  /**
   * 组件的挂载、更新
   * @param n1
   * @param n2
   * @param container
   * @param anchor
   */
  const processComponent = (n1: VNode, n2: VNode, container: RendererElement, anchor: RendererElement = null) => {
    if (n1 == null) {
      // 挂载
      mountComponent(n2, container, anchor)
    }
    else {
      // 更新
    }
  }

  /**
   * 挂载和更新函数
   * @param n1 老节点
   * @param n2 新节点
   * @param container 容器
   */
  const patch = (n1: VNode, n2: VNode, container: RendererElement, anchor: RendererElement = null) => {
    if (n1 === n2) {
      return
    }

    if (n1 && !isSameVNodeType(n1, n2)) {
      /**
       * 如果 n1 和 n2 不是同一个类型，则需要卸载掉 n1，直接挂载 n2
       * n1 = null 是为了走下面的挂载逻辑
       * n1 h('div', 'Hello world')
       * n2 h('p', 'Hello world')
       */
      unmount(n1)
      n1 = null
    }

    const { shapeFlag, type } = n2

    switch (type) {
      case Text:
        processText(n1, n2, container, anchor)
        break

      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // dom 的挂载、更新
          processElement(n1, n2, container, anchor)
        }
        else if (shapeFlag & ShapeFlags.COMPONENT) {
          // 组件的挂载、更新
          processComponent(n1, n2, container, anchor)
        }
    }
  }

  const render = (vnode: VNode, container: RendererElement) => {
    if (vnode == null && container._vnode) {
      /**
       * 卸载
       */
      unmount(container._vnode)
    }
    else {
      /**
       * 挂载 更新
       */
      patch(container._vnode || null, vnode, container)
    }

    // 把 vnode 挂载在 container 上，以便于下一次 diff 或者卸载
    container._vnode = vnode
  }

  return {
    render,
    createApp: createAppAPI(render),
  }
}

/**
 * 求最长递增子序列
 * @param arr
 */
function getSequence(arr: number[]) {
  // 储存下标
  const result = []

  // 记录前驱节点
  const map = new Map()

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i]

    if (item === -1 || item === undefined) {
      // 过滤掉 -1，不在计算范围内
      continue
    }

    if (result.length === 0) {
      result.push(i)
      continue
    }

    const lastIndex = result[result.length - 1]
    const lastItem = arr[lastIndex]

    /**
     * arr = [10, 3, 5, 9, 12, 8, 15, 18]
     * seq = [3, 5, 9, 12, 15, 18]
     * res = [1, 2, 3, 4, 6, 7]
     */
    if (item > lastItem) {
      // 记录索引
      result.push(i)
      // 记录前驱节点
      map.set(i, lastIndex)
      continue
    }

    /**
     * item < lastItem
     * 找到最合适的来替换
     * 二分查找
     */
    let left = 0
    let right = result.length - 1

    while (left < right) {
      const mid = Math.floor((left + right) / 2)
      const midItem = arr[result[mid]]
      if (midItem < item) {
        left = mid + 1
      }
      else {
        right = mid
      }
    }

    if (arr[result[left]] > item) {
      // 找到最合适的，替换索引
      result[left] = i
      if (left > 0) {
        // 第一个的话不需要记录
        map.set(i, result[left - 1])
      }
    }
  }

  // 反向追溯
  let l = result.length
  let last = result[l - 1]
  while (l > 0) {
    l--
    // 纠正顺序
    result[l] = last
    // 找前驱节点
    last = map.get(last)
  }

  return result
}

type VNodeChildren = VNode['children']

/** https://github.com/vuejs/core/blob/vapor/packages/runtime-dom/src/nodeOps.ts */
export interface RendererNode {
  [key: string | symbol]: any
}

export interface RendererElement extends RendererNode {}

export type ElementNamespace = 'svg' | 'mathml' | undefined

/** Preventing errors */
type ComponentInternalInstance = any
type VNodeProps = any

export interface RendererOptions<HostNode = RendererNode, HostElement = RendererElement> {
  patchProp: (
    el: HostElement,
    key: string,
    prevValue: any,
    nextValue: any,
    namespace?: ElementNamespace,
    parentComponent?: ComponentInternalInstance | null,
  ) => void
  insert: (el: HostNode, parent: HostElement, anchor?: HostNode | null) => void
  remove: (el: HostNode) => void
  createElement: (
    type: string,
    namespace?: ElementNamespace,
    isCustomizedBuiltIn?: string,
    vnodeProps?: (VNodeProps & { [key: string]: any }) | null,
  ) => HostElement
  createText: (text: string) => HostNode
  createComment: (text: string) => HostNode
  setText: (node: HostNode, text: string) => void
  setElementText: (node: HostElement, text: string) => void
  parentNode: (node: HostNode) => HostElement | null
  nextSibling: (node: HostNode) => HostNode | null
  querySelector?: (selector: string) => HostElement | null
  setScopeId?: (el: HostElement, id: string) => void
  cloneNode?: (node: HostNode) => HostNode
  insertStaticContent?: (
    content: string,
    parent: HostElement,
    anchor: HostNode | null,
    namespace: ElementNamespace,
    start?: HostNode | null,
    end?: HostNode | null,
  ) => [HostNode, HostNode]
}
