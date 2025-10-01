import type { RendererElement } from '../renderer'
import { getCurrentInstance } from '../component'
import { h } from '../h'

function resolveTransitionProps(props: any) {
  const {
    name = 'v',
    enterFromClass = `${name}-enter-from`,
    enterActiveClass = `${name}-enter-active`,
    enterToClass = `${name}-enter-to`,
    leaveFromClass = `${name}-leave-from`,
    leaveActiveClass = `${name}-leave-active`,
    leaveToClass = `${name}-leave-to`,
    onBeforeEnter,
    onBeforeLeave,
    onEnter,
    onLeave,
    ...rest
  } = props

  return {
    ...rest,
    beforeEnter(el: RendererElement) {
      el.classList.add(enterFromClass)
      el.classList.add(enterActiveClass)

      onBeforeEnter?.(el)
    },
    enter(el: RendererElement) {
      const done = () => {
        el.classList.remove(enterActiveClass)
        el.classList.remove(enterToClass)
      }

      requestAnimationFrame(() => {
        el.classList.remove(enterFromClass)
        el.classList.add(enterToClass)
      })

      onEnter?.(el, done)

      if (!onEnter || onEnter.length < 2) {
        el.addEventListener('transitionend', done, { once: true })
      }
    },
    leave(el: RendererElement, remove: () => void) {
      el.classList.add(leaveFromClass)
      el.classList.add(leaveActiveClass)

      onBeforeLeave?.(el)

      const done = () => {
        el.classList.remove(leaveActiveClass)
        el.classList.remove(leaveToClass)
        remove()
      }

      requestAnimationFrame(() => {
        el.classList.remove(leaveFromClass)
        el.classList.add(leaveToClass)
      })

      onLeave?.(el, done)

      if (!onLeave || onLeave.length < 2) {
        el.addEventListener('transitionend', done, { once: true })
      }
    },
  }
}

export function Transition(props: any, { slots }) {
  return h(BaseTransition, resolveTransitionProps(props), slots)
}

const BaseTransition = {
  // appear 首次渲染时是否应用过渡效果
  props: ['appear', 'enter', 'leave', 'beforeEnter', 'beforeLeave'],
  setup(props: any, { slots }) {
    const vm = getCurrentInstance()

    return () => {
      const vnode = slots.default()

      if (!vnode)
        return

      // appear 为 false 或者不是首次渲染时，才应用过渡效果
      if (props.appear || vm.isMounted) {
        vnode.transition = props
      }
      else {
        vnode.transition = {
          leave: props.leave,
        }
      }

      return vnode
    }
  },
}
