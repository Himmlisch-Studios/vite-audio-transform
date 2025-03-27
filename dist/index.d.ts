import type { Plugin } from "vite" with { 'resolution-mode': 'import' };
export declare type AudioTransformType = 'ogg' | 'mp3' | 'flac' | 'webm' | 'm4a' | 'wav';
export declare type AudioTransformOpts = {
    type: AudioTransformType;
    quality: number | undefined;
};
export default function viteAudioTransform({ type, quality }?: AudioTransformOpts): Plugin;
