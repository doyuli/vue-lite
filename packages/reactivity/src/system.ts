import { type ComputedRefImpl as Computed } from './computed';

export interface Dependency {
  subs: Link | undefined
  subsTail: Link | undefined
}

export interface Subscriber {
  deps: Link | undefined
  depsTail: Link | undefined
  tracking: boolean
  dirty: boolean
}

export interface Link {
  nextSub: Link | undefined
  prevSub: Link | undefined
  sub: Subscriber
  dep: Dependency
  nextDep: Link | undefined
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

  return createLink(dep, sub, nextDep, currentDep)
}

/**
 * 派发更新
 */
export function propagate(subs: Link) {
  let link = subs
  let queueEffects = []

  // 遍历链表，执行订阅者
  while (link) {
    const sub = link.sub
    if (!sub.tracking && !sub.dirty) {
      sub.dirty = true
      if ('update' in sub) {
        // computed
        processComputedUpdate(sub as Computed)
      } else {
        queueEffects.push(link.sub)
      }
    }
    link = link.nextSub
  }

  queueEffects.forEach((effect) => effect.notify())
}

/**
 * computed 派发更新
 */
function processComputedUpdate(sub: Computed) {
  // 调用 sub.update
  if (sub.subs && sub.update()) {
    // 通知 subs 重新执行
    propagate(sub.subs)
  }
}

/**
 * 开始依赖追踪
 */
export function startTracking(sub: Subscriber) {
  sub.tracking = true
  sub.depsTail = undefined
}

/**
 * 结束依赖追踪
 */
export function endTracking(sub: Subscriber) {
  sub.dirty = false
  const depsTail = sub.depsTail
  // 尝试复用节点失败时，
  // 新创建的 link 节点的 nextDep 会指向这个复用失败的节点
  // 依赖追踪完毕， depsTail 还有 nextDep ，说明这个是前面复用失败的节点，应该被丢弃
  if (depsTail) {
    if (depsTail.nextDep) {
      clearTracking(depsTail.nextDep)
      depsTail.nextDep = undefined
    }
  }
  // depsTail 没有，并且头节点有，把所有依赖关系都清理掉
  else if (sub.deps) {
    clearTracking(sub.deps)
    sub.deps = undefined
  }

  sub.tracking = false
}

/**
 * 清理依赖关系
 */
export function clearTracking(link: Link) {
  const { prevSub, nextSub, nextDep, dep } = link
  while (link) {
    // 有上一个节点
    if (prevSub) {
      prevSub.nextSub = nextSub
      link.nextSub = undefined
    }
    // 没有那就是头节点
    else {
      dep.subs = nextSub
    }

    // 下一个节点
    if (nextSub) {
      nextSub.prevSub = prevSub
      link.prevSub = undefined
    }
    // 没有那就是尾节点
    else {
      dep.subsTail = prevSub
    }

    // 清理关联依赖
    link.dep = link.sub = undefined
    link.nextDep = undefined

    // 指向下一个节点循环
    link = nextDep
  }
}

function createLink(dep: Dependency, sub: Subscriber, nextDep: Link | undefined, depsTail: Link | undefined) {

  const newLink = {
    sub,
    dep,
    nextDep,
    nextSub: undefined,
    prevSub: undefined,
  }

  // 建立 dep 关联关系
  if (dep.subsTail) {
    dep.subsTail.nextSub = newLink
    newLink.prevSub = dep.subsTail
  } else {
    dep.subs = newLink
  }
  dep.subsTail = newLink

  // 建立 sub 关联关系
  if (depsTail) {
    depsTail.nextDep = newLink
  } else {
    sub.deps = newLink
  }
  sub.depsTail = newLink

  return newLink
}