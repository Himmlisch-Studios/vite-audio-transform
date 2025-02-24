# vite-audio-transform

ViteJS plugin to convert and compress all your audio files using FFmpeg

## Usage

Install using NPM

```
npm install vite-audio-transform
```

Import it in your vite config

```ts
export default defineConfig({
    plugins: [
        viteAudioTransform({ type: 'webm', quality: 4 }),
    ],
});
```