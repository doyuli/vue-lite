import type { RendererElement } from './renderer'
import type { VNode } from './vnode'
import { h } from './h'

export function createAppAPI(render: (vnode: VNode, container: RendererElement) => void) {
  return function createApp(rootComponent: any, rootProps: any) {
    const app = {
      _container: null,
      mount(container: RendererElement) {
        // 创建组件的 vnode
        const vnode = h(rootComponent, rootProps)
        // 挂载
        render(vnode, container)
        // 保存 container， unmount 时使用
        app._container = container
      },
      unmount() {
        render(null, app._container)
      },
    }

    return app
  }
}
