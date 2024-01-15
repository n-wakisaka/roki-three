import { Vector3, Quaternion, Matrix4 } from 'three';
import { ZTKParser } from '../zeda/ZTKParser.js';

export class Frame {
  pos: Vector3;
  att: Quaternion;

  constructor(pos?: Vector3, att?: Quaternion) {
    this.pos = pos?.clone() ?? new Vector3();
    this.att = att?.clone() ?? new Quaternion();
  }

  clone(): Frame {
    return new Frame(this.pos, this.att);
  }

  copy(frame: Frame): void {
    this.pos.copy(frame.pos);
    this.att.copy(frame.att);
  }

  setAttFromVectors(axes: [Vector3, Vector3, Vector3]): void {
    const mat = new Matrix4();
    mat.makeBasis(axes[0], axes[1], axes[2]);
    this.att.setFromRotationMatrix(mat);
  }

  fromZTK(parser: ZTKParser): void {
    const v = parser.getNumbers(12);
    this.pos.set(v[3], v[7], v[11]);
    const mat = new Matrix4();
    mat.set(v[0], v[1], v[2], 0, v[4], v[5], v[6], 0, v[8], v[9], v[10], 0, 0, 0, 0, 1);
    this.att.setFromRotationMatrix(mat);
  }

  posFromZTK(this: Frame, parser: ZTKParser): void {
    const v = parser.getNumbers(3);
    this.pos.set(v[0], v[1], v[2]);
  }

  attFromZTK(this: Frame, parser: ZTKParser): void {
    const v = parser.getNumbers(9);
    const mat = new Matrix4();
    mat.set(v[0], v[1], v[2], 0, v[3], v[4], v[5], 0, v[6], v[7], v[8], 0, 0, 0, 0, 1);
    this.att.setFromRotationMatrix(mat);
  }
}
