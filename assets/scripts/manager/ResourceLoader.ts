import { AudioManager } from './AudioManager';
import { PrefabManager } from './PrefabManager';

interface IOnProgress {
    (progress: number): void;
}

interface IOnComplete {
    (): void;
}

interface IResLoader {
    (onProgress: IOnProgress): Promise<void>;
}

export class ResourceLoader {
    public static resToLoader = new Map<string, IResLoader>();

    public static registerResLoader(type: string, loader: IResLoader) {
        ResourceLoader.resToLoader.set(type, loader);
        ResourceLoader.progressMap.set(type, 0);
    }

    public static progressMap = new Map<string, number>();

    public static loadedCount = 0;

    public static init(onProgress: IOnProgress, onComplete: IOnComplete) {
        const onProgressWrap = (type: string) => (progress: number) => {
            ResourceLoader.progressMap.set(type, progress);
            let totalProgress = 0;
            for (let [, progress] of ResourceLoader.progressMap) {
                totalProgress += progress;
            }
            onProgress(totalProgress / ResourceLoader.resToLoader.size);
        };

        const onCompleteWrap = () => {
            ResourceLoader.loadedCount++;
            if (ResourceLoader.loadedCount === ResourceLoader.resToLoader.size) {
                onComplete();
            }
        };

        for (let [type, loader] of ResourceLoader.resToLoader) {
            loader(onProgressWrap(type))
                .then(() => {
                    console.log(`${type} 加载完成`);
                    onCompleteWrap();
                })
                .catch(err => {
                    console.error(`${type} 加载失败`, err);
                });
        }
    }
}

ResourceLoader.registerResLoader('prefab', PrefabManager.loadPrefabs);
ResourceLoader.registerResLoader('sound', AudioManager.loadSounds);
