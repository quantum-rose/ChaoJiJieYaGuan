import { _decorator, AudioClip, AudioSource, director, Node, resources } from 'cc';
import { DataManager } from './DataManager';
const { ccclass, property } = _decorator;

@ccclass('AudioManager')
export class AudioManager {
    private static _audioSource: AudioSource = null;

    private static _resources = new Map<string, AudioClip>();

    public static init() {
        const audioNode = new Node('AudioManager');
        director.getScene().addChild(audioNode);
        director.addPersistRootNode(audioNode);

        AudioManager._audioSource = audioNode.addComponent(AudioSource);

        AudioManager._audioSource.volume = DataManager.getVolume();
    }

    public static loadSounds(onProgress: (progress: number) => void): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            resources.loadDir(
                'sound',
                AudioClip,
                (finished, total) => {
                    onProgress(finished / total);
                },
                (err, assets) => {
                    if (assets) {
                        for (let clip of assets) {
                            AudioManager._resources.set(clip.name, clip);
                        }
                        resolve();
                    } else {
                        reject(err);
                    }
                }
            );
        });
    }

    public static playSound(name: string) {
        if (AudioManager._resources.has(name)) {
            const clip = AudioManager._resources.get(name);
            AudioManager._audioSource.clip = clip;
            AudioManager._audioSource.playOneShot(clip);
        }
    }

    public static setSoundEnabled(enabled: boolean) {
        if (AudioManager._audioSource) {
            const volume = enabled ? 1 : 0;
            AudioManager._audioSource.volume = volume;
            DataManager.setVolume(volume);
        }
    }
}
