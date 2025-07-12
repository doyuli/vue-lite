import { createRenderer } from '@vue/runtime-core'
import { isString } from '@vue/shared'
import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'

export * from '@vue/runtime-core'

export const rendererOption = { ...nodeOps, patchProp }

const renderer = createRenderer(rendererOption)

export function render(vnode: any, container: Element) {
  renderer.render(vnode, container)
}

export function createApp(rootComponent: any, rootProps: any) {
  const app = renderer.createApp(rootComponent, rootProps)

  const _mount = app.mount.bind(app)

  /**
   * 重写 app.mount，支持 dom 选择器
   * runtime-core 分层，不能使用 document
   * @param selector
   */
  function mount(selector: any) {
    let el = selector
    if (isString(selector)) {
      el = document.querySelector(selector)
    }
    _mount(el)
  }
  app.mount = mount

  return app
}
