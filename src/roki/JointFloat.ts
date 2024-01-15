import { Vector3, Quaternion } from 'three';
import { Frame } from '../zeo/Frame.js';
import { Joint } from './Joint.js';
import { quaternionToAxisAngle } from '../util/quaternion.js';

type floatDisType = [number, number, number, number, number, number];

export class JointFloat extends Joint {
  static readonly NAME = 'float';
  readonly DOF = 6;

  private pos = new Vector3();
  private att = new Quaternion();

  setDis(val: floatDisType): void {
    this.pos.setX(val[0]);
    this.pos.setY(val[1]);
    this.pos.setZ(val[2]);

    const vec = new Vector3(val[3], val[4], val[5]);
    const angle = vec.length();
    if (angle < 0.0001) {
      this.att.set(0.0, 0.0, 0.0, 1.0);
    } else {
      vec.normalize();
      this.att.setFromAxisAngle(vec, angle);
    }
  }

  getDis(): floatDisType {
    const [v, angle] = quaternionToAxisAngle(this.att);
    v.multiplyScalar(angle);
    return [this.pos.x, this.pos.y, this.pos.z, v.x, v.y, v.z];
  }

  transform(frame: Frame): void {
    frame.pos.add(this.pos);
    frame.att.multiply(this.att);
  }
}
