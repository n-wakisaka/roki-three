import { Vector3 } from 'three';
import { Frame } from '../zeo/Frame.js';
import { Joint } from './Joint.js';

export class JointPrism extends Joint {
  static readonly NAME = 'prismatic';
  readonly DOF = 1;

  private dis = 0.0;
  private axis = new Vector3(0.0, 0.0, 1.0);

  setDis(val: [number]): void {
    this.dis = val[0];
  }

  getDis(): [number] {
    return [this.dis];
  }

  transform(frame: Frame): void {
    const dis = this.axis.clone();
    dis.multiplyScalar(this.dis);
    frame.pos.add(dis);
  }
}
