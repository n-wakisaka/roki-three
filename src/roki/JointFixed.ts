import { Frame } from '../zeo/Frame.js';
import { Joint } from './Joint.js';

export class JointFixed extends Joint {
  static readonly NAME = 'fixed';
  readonly DOF = 0;

  setDis(): void {}

  getDis(): void {}

  transform(_frame: Frame): void {}
}
