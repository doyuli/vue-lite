import { RefImpl } from './ref'

export interface Link {
  nextSub?: Link
  prevSub?: Link
  sub: Function
}

/**
 * 建立链表关系
 */
export function link(dep: RefImpl, sub: Function) {
  const _link = {
    sub,
    nextSub: undefined,
    prevSub: undefined,
  }

  // 链表
  if (!dep.subs) {
    dep.subs = _link
    dep.subsTail = _link
  } else {
    dep.subsTail.nextSub = _link
    _link.prevSub = dep.subsTail
    dep.subsTail = _link
  }
}

/**
 * 派发更新
 */
export function propagate(subs: Link) {
  let currentSub = subs
  let queueEffects = []

  // 遍历链表，执行订阅者
  while (currentSub) {
    queueEffects.push(currentSub.sub)
    currentSub = currentSub.nextSub
  }

  queueEffects.forEach((effect) => effect.run())
}
