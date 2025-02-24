import { dataToEsm } from '@rollup/pluginutils'
import { basename, extname } from "node:path";
import { readFile, rm } from "node:fs/promises";
import type { Plugin, ResolvedConfig } from "vite" with { 'resolution-mode': 'import' };
import ffmpeg from "fluent-ffmpeg";

const fileRegex = /\.(ogg|mp3|flac|m4a|wav)$/

function convertAudio(origin: string, target: string, flags: string[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
        ffmpeg(origin)
            .addOptions(flags)
            .output(target)
            .on('error', (e) => reject(e))
            .on('end', () => resolve())
            .run();

    });
}

export declare type AudioTransformType = 'ogg' | 'mp3' | 'flac' | 'webm' | 'm4a' | 'wav';

export declare type AudioTransformOpts = {
    type: AudioTransformType,
    quality: number | undefined
}

export default function viteAudioTransform({
    type = 'ogg',
    quality = undefined
} = {} as AudioTransformOpts): Plugin {
    const optionsByFormat = {
        ogg: {
            'q:a': quality ?? 5 // -1 to 10,
        },
        mp3: {
            'q:a': quality ?? 5 // 0 to 9,
        },
        flac: {
            'compression_level': quality ?? 0. // 0 to 12
        },
        webm: {
            'b:a': (quality ?? 96) + 'k'
        },
        m4a: {
            vbr: quality ?? 3,
        },
        wav: {}
    } as { [key in AudioTransformType]: { [key: string]: number | string | undefined } };

    const typeOpts = optionsByFormat[type];

    if (typeOpts === undefined) {
        throw new Error("Not supported audio conversion type")
    }

    // const config = {

    // };

    const conversionConfig = {
        ...typeOpts
    };

    const conversionFlags: string[] = [];

    for (const flag in conversionConfig) {
        const value = conversionConfig[flag];
        if (value !== undefined || value !== null) {
            conversionFlags.push(`-${flag} ${value}`);
        }
    }

    const tempFiles = new Set<string>;

    const transformAudioFile = async (filePath: string) => {
        const tempPath = filePath.replace(fileRegex, `_$temp.${type}`);

        await convertAudio(filePath, tempPath, conversionFlags);

        const buffer = await readFile(tempPath);

        tempFiles.add(tempPath);

        return buffer;

    }

    let viteConfig: ResolvedConfig;

    let assetsInlineLimit: (filePath: string, content: Buffer) => boolean | undefined;

    return {
        name: 'vite-audio-transform',
        enforce: 'pre',
        configResolved(cfg: ResolvedConfig) {
            viteConfig = cfg;

            assetsInlineLimit = typeof viteConfig.build.assetsInlineLimit === 'function'
                ? viteConfig.build.assetsInlineLimit
                : (_, buffer) => buffer.byteLength <= (viteConfig.build.assetsInlineLimit as number);

        },
        async load(filePath: string) {
            if (viteConfig.command !== 'build') return;
            if (!fileRegex.test(filePath)) return;


            const audio = await transformAudioFile(filePath);

            if (assetsInlineLimit(filePath, audio)) {
                return `export default "data:audio/${type};base64,${audio.toString('base64')}";`;
            }

            const fileHandle = this.emitFile({
                name: basename(filePath, extname(filePath)) + `.${type}`,
                source: audio,
                type: 'asset'
            })

            return dataToEsm(`__VITE_ASSET__${fileHandle}__`, {
                namedExports: viteConfig.json?.namedExports ?? true,
                compact: !!viteConfig.build.minify,
                preferConst: true,
                objectShorthand: true
            })
        },
        async buildEnd() {
            const promises: Array<Promise<void>> = [];
            for (const filepath of tempFiles) {
                promises.push(
                    rm(filepath).catch((e) => console.warn(`Unable to clear temp audio file ${filepath}.\n${e}`))
                );
            }

            await Promise.all(promises);
        }

    }
}