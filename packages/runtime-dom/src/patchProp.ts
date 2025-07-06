import type { RendererOptions } from '@vue/runtime-core'
import { isOn } from '@vue/shared'
import { patchClass } from './modules/class'
import { patchEvent } from './modules/event'
import { patchStyle } from './modules/style'

type DOMRendererOptions = RendererOptions<Node, Element>

export const patchProp: DOMRendererOptions['patchProp'] = (el, key, prevValue, nextValue) => {
  if (key === 'class') {
    patchClass(el, nextValue)
  }
  else if (key === 'style') {
    patchStyle(el, prevValue, nextValue)
  }
  // @click => onClick
  else if (isOn(key)) {
    patchEvent(el, key, nextValue)
  }
}
