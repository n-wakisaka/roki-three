import { Vector3, Quaternion } from 'three'
import { Frame } from '../zeo/Frame.js'
import { Joint } from './Joint.js'

export class JointRevol extends Joint {
  static readonly NAME = 'revolute'
  readonly DOF = 1

  private angle = 0.0
  private axis = new Vector3(0.0, 0.0, 1.0)

  setDis(val: [number]): void {
    this.angle = val[0]
  }

  getDis(): [number] {
    return [this.angle]
  }

  transform(frame: Frame): void {
    const rot = new Quaternion()
    rot.setFromAxisAngle(this.axis, this.angle)
    frame.att.multiply(rot)
  }
}
