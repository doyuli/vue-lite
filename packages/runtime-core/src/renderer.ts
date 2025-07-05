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

export function createRenderer(options: RendererOptions) {
  console.log(options)
}
