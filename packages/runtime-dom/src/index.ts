import { createRenderer } from '@vue/runtime-core'
import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'

export * from '@vue/runtime-core'

export const rendererOption = { ...nodeOps, patchProp }

const renderer = createRenderer(rendererOption)

export function render(vnode: any, container: Element) {
  renderer.render(vnode, container)
}
