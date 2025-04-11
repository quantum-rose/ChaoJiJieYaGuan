import { _decorator, Component, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BaseView')
export class BaseView extends Component {
    public show() {
        if (this.node.parent !== null) {
            this.node.parent = null;
        }
        const scene = director.getScene();
        scene.getChildByName('Canvas')?.addChild(this.node);
    }

    public hide() {
        this.node.removeFromParent();
    }
}
