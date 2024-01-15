import { Frame } from '../zeo/Frame.js';

export abstract class Joint {
  static readonly NAME: string;
  readonly DOF: number = 0;

  abstract setDis(val?: Array<number>): void;
  abstract getDis(): void | Array<number>;
  abstract transform(frame: Frame): void;
}
