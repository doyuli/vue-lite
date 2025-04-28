import esbuild from 'esbuild'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))

const {
  values: { format },
  positionals,
} = parseArgs({
  allowPositionals: true,
  options: {
    format: {
      type: 'string',
      short: 'f',
      default: 'esm',
    },
  },
})

const target = positionals.length ? positionals[0] : 'vue'

const pkgBase = `../packages/${target}`

const entry = resolve(__dirname, `${pkgBase}/src/index.ts`)

const outfile = resolve(__dirname, `${pkgBase}/dist/${target}.${format}.js`)

const pkg = require(`${pkgBase}/package.json`)

esbuild
  .context({
    entryPoints: [entry],
    outfile,
    format,
    bundle: true,
    sourcemap: true,
    globalName: pkg.buildOptions?.name,
    platform: format === 'cjs' ? 'node' : 'browser',
  })
  .then((ctx) => ctx.watch())
