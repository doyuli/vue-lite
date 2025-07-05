import type { ComputedRefImpl as Computed } from './computed'

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
  const queueEffects = []

  // 遍历链表，执行订阅者
  while (link) {
    const sub = link.sub
    if (!sub.tracking && !sub.dirty) {
      sub.dirty = true
      if ('update' in sub) {
        // computed
        processComputedUpdate(sub as Computed)
      }
      else {
        queueEffects.push(link.sub)
      }
    }
    link = link.nextSub
  }

  queueEffects.forEach(effect => effect.notify())
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
  // 标记正在追踪依赖
  sub.tracking = true

  /**
   * effect 每次开始追踪依赖时，都把 depsTail 设置为 undefined
   * 在 ref 的 getter 中创建依赖关联关系，即在 link 函数中
   *
   * 当 sub.depsTail 和 sub.deps 都为 undefined 时，说明该节点没有被收集过
   *
   * 当 sub.depsTail 为 undefined，sub.deps 有值时，
   * 判断 sub.deps.dep 是否为当前所收集的依赖，是的话则复用，
   * 最后把 sub.depsTail 指向 sub.deps
   *
   * 当 sub.depsTail 和 sub.deps 都有值时，
   * 判断 sub.depsTail.nextDep.dep 是否为当前所收集的依赖，是的话则复用
   *
   * 可以理解为这里每次都会去尝试复用 sub.depsTail.nextDep，
   * 但是由于 effect 执行之前会把 depsTail 设置为 undefined，
   * 所以第一次尝试复用的是 sub.deps
   */
  sub.depsTail = undefined
}

/**
 * 结束依赖追踪
 */
export function endTracking(sub: Subscriber) {
  // 把 effect 重新标记为未被执行过
  sub.dirty = false

  const depsTail = sub.depsTail
  // 尝试复用节点失败时，
  // 新创建的 link 节点的 nextDep 会指向这个复用失败的节点
  // 依赖追踪完毕， depsTail 还有 nextDep ，说明这个是前面复用失败的节点，应该被丢弃
  if (depsTail) {
    // 因为 nextDep 指向复用失败的节点
    // 当尾节点还有 nextDep 时，需要清理
    if (depsTail.nextDep) {
      clearTracking(depsTail.nextDep)
      depsTail.nextDep = undefined
    }
  }
  // depsTail 为 undefined，sub.deps 有值，则说明全部都是过期依赖
  else if (sub.deps) {
    clearTracking(sub.deps)
    sub.deps = undefined
  }

  // 标记追踪结束
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
    // 说明是头节点
    else {
      dep.subs = nextSub
    }

    // 下一个节点
    if (nextSub) {
      nextSub.prevSub = prevSub
      link.prevSub = undefined
    }
    // 说明是尾节点
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

function createLink(
  dep: Dependency,
  sub: Subscriber,
  nextDep: Link | undefined,
  depsTail: Link | undefined,
) {
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
  }
  else {
    dep.subs = newLink
  }
  dep.subsTail = newLink

  // 建立 sub 关联关系
  if (depsTail) {
    depsTail.nextDep = newLink
  }
  else {
    sub.deps = newLink
  }
  sub.depsTail = newLink

  return newLink
}
