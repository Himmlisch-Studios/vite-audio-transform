import { dataToEsm } from '@rollup/pluginutils';
import { basename, extname } from 'node:path';
import { rm, readFile } from 'node:fs/promises';
import ffmpeg from 'fluent-ffmpeg';

const fileRegex = /\.(ogg|mp3|flac|m4a|wav)$/;
function convertAudio(origin, target, flags = []) {
    return new Promise((resolve, reject) => {
        ffmpeg(origin)
            .addOptions(flags)
            .output(target)
            .on('error', (e) => reject(e))
            .on('end', () => resolve())
            .run();
    });
}
function viteAudioTransform({ type = 'ogg', quality = undefined } = {}) {
    const optionsByFormat = {
        ogg: {
            'q:a': quality !== null && quality !== void 0 ? quality : 5 // -1 to 10,
        },
        mp3: {
            'q:a': quality !== null && quality !== void 0 ? quality : 5 // 0 to 9,
        },
        flac: {
            'compression_level': quality !== null && quality !== void 0 ? quality : 0. // 0 to 12
        },
        webm: {
            'b:a': (quality !== null && quality !== void 0 ? quality : 96) + 'k'
        },
        m4a: {
            vbr: quality !== null && quality !== void 0 ? quality : 3,
        },
        wav: {}
    };
    const typeOpts = optionsByFormat[type];
    if (typeOpts === undefined) {
        throw new Error("Not supported audio conversion type");
    }
    // const config = {
    // };
    const conversionConfig = {
        ...typeOpts
    };
    const conversionFlags = [];
    for (const flag in conversionConfig) {
        const value = conversionConfig[flag];
        if (value !== undefined || value !== null) {
            conversionFlags.push(`-${flag} ${value}`);
        }
    }
    const tempFiles = new Set;
    const transformAudioFile = async (filePath) => {
        const tempPath = filePath.replace(fileRegex, `_$temp.${type}`);
        await convertAudio(filePath, tempPath, conversionFlags);
        const buffer = await readFile(tempPath);
        tempFiles.add(tempPath);
        return buffer;
    };
    let viteConfig;
    let assetsInlineLimit;
    return {
        name: 'vite-audio-transform',
        enforce: 'pre',
        configResolved(cfg) {
            viteConfig = cfg;
            assetsInlineLimit = typeof viteConfig.build.assetsInlineLimit === 'function'
                ? viteConfig.build.assetsInlineLimit
                : (_, buffer) => buffer.byteLength <= viteConfig.build.assetsInlineLimit;
        },
        async load(filePath) {
            var _a, _b;
            if (viteConfig.command !== 'build')
                return;
            if (!fileRegex.test(filePath))
                return;
            const audio = await transformAudioFile(filePath);
            if (assetsInlineLimit(filePath, audio)) {
                return `export default "data:audio/${type};base64,${audio.toString('base64')}";`;
            }
            const fileHandle = this.emitFile({
                name: basename(filePath, extname(filePath)) + `.${type}`,
                source: audio,
                type: 'asset'
            });
            return dataToEsm(`__VITE_ASSET__${fileHandle}__`, {
                namedExports: (_b = (_a = viteConfig.json) === null || _a === void 0 ? void 0 : _a.namedExports) !== null && _b !== void 0 ? _b : true,
                compact: !!viteConfig.build.minify,
                preferConst: true,
                objectShorthand: true
            });
        },
        async buildEnd() {
            const promises = [];
            for (const filepath of tempFiles) {
                promises.push(rm(filepath).catch((e) => console.warn(`Unable to clear temp audio file ${filepath}.\n${e}`)));
            }
            await Promise.all(promises);
        }
    };
}

export { viteAudioTransform as default };
//# sourceMappingURL=index.js.map
