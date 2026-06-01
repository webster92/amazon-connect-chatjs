import { build } from 'esbuild'
await build({
  entryPoints: ['src/client/client.js'],
  bundle: true,
  format: 'esm',
  outfile: 'dist/chatclient.esm.js',
  platform: 'browser',
})
