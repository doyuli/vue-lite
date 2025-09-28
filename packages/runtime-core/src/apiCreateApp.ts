import type { InjectKey } from './apiInject'
import type { RendererElement } from './renderer'
import type { VNode } from './vnode'
import { h } from './h'

export function createAppAPI(render: (vnode: VNode, container: RendererElement) => void) {
  return function createApp(rootComponent: any, rootProps: any) {
    const context = {
      // app 往后代组件使用 provide 注入的属性
      provides: {},
    }

    const app = {
      _container: null,
      context,
      mount(container: RendererElement) {
        // 创建组件的 vnode
        const vnode = h(rootComponent, rootProps)
        // 根组件绑定 appContext
        vnode.appContext = context
        // 挂载
        render(vnode, container)
        // 保存 container， unmount 时使用
        app._container = container
      },
      unmount() {
        render(null, app._container)
      },
      provide(key: InjectKey, value: unknown) {
        context.provides[key] = value
      },
    }

    return app
  }
}
