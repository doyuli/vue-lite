import type { RendererElement, RendererNode } from './renderer'
import { isArray, isNumber, isString, ShapeFlags } from '@vue/shared'

/**
 * 文本节点标记
 */
export const Text = Symbol('v-txt')

/**
 * 标准化 vnode
 * @param vnode
 */
export function normalizeVNode(vnode: VNode): VNode {
  if (isString(vnode) || isNumber(vnode)) {
    return createVNode(Text, null, String(vnode))
  }
  else if (isVNode(vnode)) {
    return vnode
  }
  return vnode
}

export function isSameVNodeType(n1: VNode, n2: VNode) {
  return n1.type === n2.type && n1.key === n2.key
}

export function isVNode(vlaue: any) {
  return vlaue?.__v_isVNode
}

export function createVNode(type: VNodeTypes, props?: any, children: any = null): VNode {
  let shapeFlag: number = 0

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
  } as VNode

  return vnode
}

export type VNodeTypes
  = | string
    | VNode
    | typeof Text
    | typeof Comment

/** Preventing errors */
type VNodeNormalizedRef = any
type VNodeProps = any
type VNodeNormalizedChildren = any
type ComponentInternalInstance = any
type AppContext = any
/** https://github.com/vuejs/core/blob/vapor/packages/runtime-core/src/vnode.ts */
export interface VNode<
  HostNode = RendererNode,
  HostElement = RendererElement,
  ExtraProps = { [key: string]: any },
> {
  /**
   * @internal
   */
  __v_isVNode: true

  // [ReactiveFlags.SKIP]: true

  type: any
  props: (VNodeProps & ExtraProps) | null
  key: PropertyKey | null
  ref: VNodeNormalizedRef | null
  /**
   * SFC only. This is assigned on vnode creation using currentScopeId
   * which is set alongside currentRenderingInstance.
   */
  scopeId: string | null
  /**
   * SFC only. This is assigned to:
   * - Slot fragment vnodes with :slotted SFC styles.
   * - Component vnodes (during patch/hydration) so that its root node can
   *   inherit the component's slotScopeIds
   * @internal
   */
  slotScopeIds: string[] | null
  children: VNodeNormalizedChildren
  component: ComponentInternalInstance | null
  // dirs: DirectiveBinding[] | null
  // transition: TransitionHooks<HostElement> | null

  // DOM
  el: HostNode | null
  anchor: HostNode | null // fragment anchor
  target: HostElement | null // teleport target
  targetStart: HostNode | null // teleport target start anchor
  targetAnchor: HostNode | null // teleport target anchor
  /**
   * number of elements contained in a static vnode
   * @internal
   */
  staticCount: number

  // suspense
  // suspense: SuspenseBoundary | null
  /**
   * @internal
   */
  ssContent: VNode | null
  /**
   * @internal
   */
  ssFallback: VNode | null

  // optimization only
  shapeFlag: number
  patchFlag: number
  /**
   * @internal
   */
  dynamicProps: string[] | null
  /**
   * @internal
   */
  dynamicChildren: (VNode[] & { hasOnce?: boolean }) | null

  // application root node only
  appContext: AppContext | null

  /**
   * @internal
   */
  ctx: ComponentInternalInstance | null

  /**
   * @internal
   */
  memo?: any[]
  /**
   * @internal
   */
  cacheIndex?: number
  /**
   * @internal
   */
  isCompatRoot?: true
  /**
   * @internal
   */
  ce?: (instance: ComponentInternalInstance) => void
  /**
   * @internal
   */
  vi?: (instance: ComponentInternalInstance) => void
  /**
   * @internal
   */
  // vs?: {
  //   slot: (props: any) => any
  //   fallback: (() => VNodeArrayChildren) | undefined
  //   ref?: ShallowRef<any>
  // }
  /**
   * @internal
   */
  vb?: any
}
