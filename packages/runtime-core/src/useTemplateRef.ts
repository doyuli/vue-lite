import { ref } from '@vue/reactivity'
import { getCurrentInstance } from './component'

export function useTemplateRef(key: string) {
  const el = ref(null)

  const instance = getCurrentInstance()

  const { refs } = instance

  Object.defineProperty(refs, key, {
    enumerable: true,
    get: () => el.value,
    set: val => (el.value = val),
  })

  return el
}
