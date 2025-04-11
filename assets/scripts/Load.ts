import { _decorator, Component, director, Label, Sprite, UITransform } from 'cc';
import { ResourceLoader } from './manager/ResourceLoader';
const { ccclass, property } = _decorator;

@ccclass('Load')
export class Load extends Component {
    public static instance: Load;

    @property(Sprite)
    bar: Sprite = null;

    @property(Label)
    version: Label = null;

    @property(Label)
    desc: Label = null;

    protected onLoad(): void {
        Load.instance = this;
        this.version.string = 'v1.0.0';

        ResourceLoader.init(this._onProgress, this._onComplete);
    }

    private _onProgress = (progress: number) => {
        this.bar.node.getComponent(UITransform).width = progress * 0.98 * 500;
        this.desc.string = `正在加载资源，请稍后... ${Math.floor(progress * 0.98 * 100)}%`;
    };

    private _onComplete = () => {
        director.preloadScene('Main', err => {
            if (!err) {
                console.log('Main 场景预加载完成');
                this.bar.node.getComponent(UITransform).width = 500;
                this.desc.string = '资源加载完成，即将进入游戏...';

                director.loadScene('Main', () => {
                    console.log('Main 场景切换完成');
                });
            } else {
                console.error('场景预加载失败', err);
            }
        });
    };
}
