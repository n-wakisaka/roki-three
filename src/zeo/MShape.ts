import { ZTKParser } from '../zeda/ZTKParser.js';
import { Shape } from './Shape.js';
import { OpticalInfo } from './OpticalInfo.js';

export class MShape {
  shape: Array<Shape> = [];
  optic: Array<OpticalInfo> = [];

  fromZTK(parser: ZTKParser) {
    const num_shape = parser.countTag('zeo::shape');
    const num_optic = parser.countTag('zeo::optic');

    // TODO: cylinder軸など各geometryのテストを書く
    this.shape = [...Array<Shape>(num_shape)].map(() => new Shape());
    this.optic = [...Array<OpticalInfo>(num_optic)].map(() => new OpticalInfo());

    parser.evaluateTag(
      {
        'zeo::optic': {
          evaluator: (parser: ZTKParser, obj: MShape, index: number): void => {
            obj.optic[index].fromZTK(parser);
          },
          num: num_optic,
        },
      },
      this,
    );

    parser.evaluateTag(
      {
        'zeo::shape': {
          evaluator: (parser: ZTKParser, obj: MShape, index: number): void => {
            obj.shape[index].fromZTK(parser, obj.optic);
          },
          num: num_shape,
        },
      },
      this,
    );
  }
}
