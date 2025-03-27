# vite-audio-transform

ViteJS plugin to convert and compress all your audio files using FFmpeg.

## Requirements

You need to have [FFmpeg](https://www.ffmpeg.org/) installed (including the necessary encoding libraries) in your system.

## Usage

Install using NPM.

```
npm install vite-audio-transform
```

Import it in your vite config.

```ts
export default defineConfig({
    plugins: [
        viteAudioTransform({ type: 'webm', quality: 4 }),
    ],
});
```

### Quality

The quality setting differs for each of the formats.

| Format |  Range   |     FFmpeg Arg      |
|:------:|:--------:|:-------------------:|
|  OGG   | -1 to 10 |        `q:a`        |
|  MP3   |  0 to 9  |        `q:a`        |
|  FLAC  | 0 to 12  | `compression_level` |
|  WEBM  |  kBit/s  |        `b:a`        |
|  M4A   |  1 to 5  |        `vbr`        |
|  WAV   |    --    |         --          |