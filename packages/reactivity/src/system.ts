export interface Dependency {
  subs: Link | undefined
  subsTail: Link | undefined
}

export interface Subscriber {
  deps: Link | undefined
  depsTail: Link | undefined
}

export interface Link {
  nextSub: Link | undefined
  prevSub: Link | undefined
  sub: Subscriber
  dep: Dependency
  nextDep: Link | undefined
}

/**
 * 开始追踪依赖
 */
export function startTracking(sub: Subscriber) {
  sub.depsTail = undefined
}

/**
 * 建立链表关联关系
 */
export function link(dep: Dependency, sub: Subscriber) {
  // 节点复用，处理依赖被多次收集问题
  const currentDep = sub.depsTail
  // 每次都尝试复用 currentDep.nextDep，
  // 由于 effect 每次执行之前都会把 sub.depTail 设置为 undefined，
  // 所以第一次要复用的是头节点
  const nextDep = currentDep === undefined ? sub.deps : currentDep.nextDep
  if (nextDep?.dep === dep) {
    sub.depsTail = nextDep
    return
  }

  const newLink = {
    sub,
    dep,
    nextDep: undefined,
    nextSub: undefined,
    prevSub: undefined,
  }

  // 建立 dep 关联关系
  if (dep.subsTail) {
    dep.subsTail.nextSub = newLink
    newLink.prevSub = dep.subsTail
    dep.subsTail = newLink
  } else {
    dep.subs = newLink
    dep.subsTail = newLink
  }

  // 建立 sub 关联关系
  if (sub.depsTail) {
    sub.depsTail.nextDep = newLink
    sub.depsTail = newLink
  } else {
    sub.deps = newLink
    sub.depsTail = newLink
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

  queueEffects.forEach((effect) => effect.notify())
}
