import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'

export * from '@vue/runtime-core'

export const rendererOption = { ...nodeOps, patchProp }
