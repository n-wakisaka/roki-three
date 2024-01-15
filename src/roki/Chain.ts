import { Object3D, Quaternion, Matrix4 } from 'three';
import { HasName } from '../util/Name.js';
import { ZTKParser } from '../zeda/ZTKParser.js';
import { MShape } from '../zeo/MShape.js';
import { Link } from './Link.js';

export class Chain extends Object3D implements HasName {
  links: Array<Link> = [];
  mshape = new MShape();

  FK(dis?: Array<number>): void {
    var offset = 0;
    for (const link of this.links) {
      const dof = link.joint?.DOF ?? 0;
      if (dof === 0) {
        continue;
      }
      link.updateFrame(dis?.slice(offset, offset + dof));
      offset += dof;
    }
  }

  getJointSize(): number {
    var cnt = 0;
    for (const link of this.links) {
      cnt += link.joint?.DOF ?? 0;
    }
    return cnt;
  }

  /*
    RoKi: x, y, z -> forward, right, up
    Three: x, y, z -> right, up, forward
    */
  transformToThree(): void {
    const mat = new Matrix4();
    mat.set(0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1);
    this.quaternion.premultiply(new Quaternion().setFromRotationMatrix(mat));
  }

  fromZTK(this: Chain, parser: ZTKParser): void {
    this.mshape.fromZTK(parser);

    const num_link = parser.countTag('link');
    this.links = [...Array<Link>(num_link)].map(() => new Link());
    this.links.forEach((l) => this.add(l));
    parser.evaluateTag(
      {
        chain: {
          evaluator: (parser: ZTKParser, obj: Chain, _index: number): void => {
            parser.evaluateKey(
              {
                name: {
                  evaluator: (parser: ZTKParser, obj: Chain, _index: number): void => {
                    obj.name = parser.getValue() ?? obj.name;
                  },
                  num: 1,
                },
              },
              obj,
            );
          },
          num: 1,
        },
        link: {
          evaluator: (parser: ZTKParser, obj: Chain, index: number): void => {
            obj.links[index].fromZTK(parser, this.mshape.shape);
          },
          num: num_link,
        },
      },
      this,
    );

    parser.evaluateTag(
      {
        link: {
          evaluator: (parser: ZTKParser, obj: Chain, index: number): void => {
            obj.links[index].connectFromZTK(parser, this.links);
          },
          num: num_link,
        },
      },
      this,
    );
    this.links.forEach((l) => l.updateFrame());
  }
}
