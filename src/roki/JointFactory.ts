import { Joint } from './Joint.js';
import { JointFixed } from './JointFixed.js';
import { JointRevol } from './JointRevol.js';
import { JointPrism } from './JointPrism.js';
import { JointFloat } from './JointFloat.js';

export class JointFactory {
  static readonly jointClasses = [JointFixed, JointRevol, JointPrism, JointFloat];

  static getInstance(name: string): Joint | undefined {
    for (const cls of JointFactory.jointClasses) {
      if (name === cls.NAME) {
        return new cls();
      }
    }
    return;
  }
}
