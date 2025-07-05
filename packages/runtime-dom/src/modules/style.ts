type Style = null | undefined | Record<string, unknown>

export function patchStyle(el: Element, prevValue: Style, nextValue: Style) {
  const style = (el as HTMLElement).style
  if (nextValue) {
    for (const key in nextValue) {
      style[key] = nextValue[key]
    }
  }

  /** 删除之前有的属性 */
  if (prevValue) {
    for (const key in prevValue) {
      if (nextValue?.[key] == null) {
        style[key] = null
      }
    }
  }
}
