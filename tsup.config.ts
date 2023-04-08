import type { Options } from 'tsup'

export default <Options>{
  entryPoints: ['src/*.ts'],
  clean: true,
  format: ['cjs', 'esm'],
  dts: true,
  onSuccess: 'rimraf dist/markdown.cjs dist/markdown.js & npm run build:fix',
}
