import { Object3D } from 'three';
import { HasName } from '../util/Name.js';
import { ZTKParser } from '../zeda/ZTKParser.js';
import { Frame } from '../zeo/Frame.js';
import { Shape } from '../zeo/Shape.js';
import { Body } from './Body.js';
import { Joint } from './Joint.js';
import { JointFactory } from './JointFactory.js';

export class Link extends Object3D implements HasName {
  body = new Body(); // not used
  joint: Joint | undefined;
  orgFrame = new Frame();

  updateFrame(dis?: Array<number>): void {
    const frame = this.orgFrame.clone();
    if (this.joint !== undefined) {
      if (dis?.length == this.joint.DOF) {
        this.joint.setDis(dis);
      }
      this.joint.transform(frame);
    }
    this.position.copy(frame.pos);
    this.quaternion.copy(frame.att);
  }

  private createJoint(this: Link, jointType: string): void {
    this.joint = JointFactory.getInstance(jointType);
  }

  fromZTK(this: Link, parser: ZTKParser, shapes: Array<Shape>): void {
    parser.evaluateKey(
      {
        'name': {
          evaluator: (parser: ZTKParser, obj: Link, _index: number): void => {
            obj.name = parser.getValue() ?? obj.name;
          },
          num: 1,
        },
        'jointtype': {
          evaluator: (parser: ZTKParser, obj: Link, _index: number): void => {
            obj.createJoint(parser.getValue() ?? '');
          },
          num: 1,
        },
        'mass': {
          // not used
          evaluator: (parser: ZTKParser, obj: Link, _index: number): void => {
            obj.body.mp.mass = parser.getNumber();
          },
          num: 1,
        },
        'stuff': {
          // not used
          evaluator: (parser: ZTKParser, obj: Link, _index: number): void => {
            obj.body.stuff = parser.getValue();
          },
          num: 1,
        },
        'COM': {
          // not used
          evaluator: (parser: ZTKParser, obj: Link, _index: number): void => {
            const v = parser.getNumbers(3);
            obj.body.mp.com.set(v[0], v[1], v[2]);
          },
          num: 1,
        },
        'inertia': {
          // not used
          evaluator: (parser: ZTKParser, obj: Link, _index: number): void => {
            const v = parser.getNumbers(9);
            obj.body.mp.inertia.set(v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7], v[8]);
          },
          num: 1,
        },
        'pos': {
          evaluator: (parser: ZTKParser, obj: Link, _index: number): void => {
            obj.orgFrame.posFromZTK(parser);
          },
          num: 1,
        },
        'att': {
          evaluator: (parser: ZTKParser, obj: Link, _index: number): void => {
            obj.orgFrame.attFromZTK(parser);
          },
          num: 1,
        },
        'frame': {
          evaluator: (parser: ZTKParser, obj: Link, _index: number): void => {
            obj.orgFrame.fromZTK(parser);
          },
          num: 1,
        },
      },
      this,
    );

    type ReadPrp = {
      link: Link;
      shapes: Array<Shape>;
    };
    const prp: ReadPrp = { link: this, shapes: shapes };

    const num_shape = parser.countKey('shape');
    parser.evaluateKey(
      {
        'shape': {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void => {
            const name = parser.getValue();
            const shape = obj.shapes.find((s) => s.name == name);
            if (shape !== undefined) {
              this.add(shape.getMesh());
            }
          },
          num: num_shape,
        },
      },
      prp,
    );
  }

  connectFromZTK(this: Link, parser: ZTKParser, links: Array<Link>): void {
    type ReadPrp = {
      link: Link;
      links: Array<Link>;
    };
    const prp: ReadPrp = { link: this, links: links };

    parser.evaluateKey(
      {
        'parent': {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void => {
            const name = parser.getValue();
            const parent = obj.links.find((l) => l.name == name);
            parent?.add(this);
          },
          num: 1,
        },
      },
      prp,
    );
  }
}
