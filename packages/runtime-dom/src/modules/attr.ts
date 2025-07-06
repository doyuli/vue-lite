export function patchAttr(el: Element, key: string, nextValue: string) {
  if (nextValue == null) {
    el.removeAttribute(key)
  }
  else {
    el.setAttribute(key, nextValue)
  }
}
