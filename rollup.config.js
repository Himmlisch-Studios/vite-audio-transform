import typescript from '@rollup/plugin-typescript'

export default {
    input: 'src/index.ts',
    external: ['@rollup/pluginutils', 'fluent-ffmpeg', 'node:path', 'node:fs/promises'],
    output: [
        {
            dir: './dist',
            entryFileNames: '[name].js',
            format: 'esm',
            sourcemap: true,
        }
    ],
    plugins: [
        typescript({ declaration: true, outDir: './dist' })
    ]
}