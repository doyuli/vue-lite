import { isString } from '@vue/shared'

type Style = string | null | undefined | Record<string, unknown>

export function patchStyle(el: Element, prevValue: Style, nextValue: Style) {
  const style = (el as HTMLElement).style

  // 有新值并且是对象形式
  if (nextValue && !isString(nextValue)) {
    // 删除之前有的属性
    if (prevValue) {
      if (!isString(prevValue)) {
        for (const key in prevValue) {
          if (nextValue?.[key] == null) {
            style[key] = null
          }
        }
      }
      else {
        // 处理字符串 style="color: red;"
        for (const prev of prevValue.split(';')) {
          const key = prev.split(':')[0].trim()
          if (nextValue?.[key] == null) {
            style[key] = null
          }
        }
      }
    }

    // 处理新值
    for (const key in nextValue) {
      // 处理 falsy value
      const val = nextValue[key] == null ? '' : nextValue[key]
      style[key] = val
    }
  }
  else {
    // 新值为字符串
    if (isString(nextValue)) {
      // 相同的不需要处理
      if (prevValue !== nextValue) {
        style.cssText = nextValue
      }
    }
    else if (prevValue) {
      // 有旧值才需要清理
      el.removeAttribute('style')
    }
  }
}
