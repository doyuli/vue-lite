import type { Component } from './component'
import { ref } from '@vue/reactivity'
import { isFunction } from '@vue/shared'
import { h } from './h'

interface AsyncComponentOptions {
  loader: () => Promise<Component>
  loadingComponent?: Component
  errorComponent?: Component
  timeout?: number
}

export function defineAsyncComponent(options: AsyncComponentOptions): Component
export function defineAsyncComponent(loader: () => Promise<Component>): Component
export function defineAsyncComponent(options: AsyncComponentOptions | (() => Promise<Component>)) {
  if (isFunction(options)) {
    options = { loader: options }
  }

  const defaultComponent = () => h('span', null, '')

  const { loader, loadingComponent = defaultComponent, errorComponent = defaultComponent, timeout } = options

  return {
    setup(props: any, { attrs, slots }) {
      const component = ref(loadingComponent)

      function loadComponent() {
        return new Promise((resolve, reject) => {
          if (timeout && timeout > 0) {
            setTimeout(() => {
              reject(new Error('timeout'))
            }, timeout)
          }
          loader().then(resolve, reject)
        })
      }

      loadComponent().then((comp: any) => {
        if (comp && comp[Symbol.toStringTag] === 'Module') {
          // 处理 import('xxx')
          comp = comp.default
        }
        component.value = comp
      }).catch(() => {
        component.value = errorComponent
      })

      return () => h(component.value, { ...props, ...attrs }, slots)
    },
  }
}
