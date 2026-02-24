import { BufferGeometry, Material, MeshBasicMaterial, Mesh } from 'three';
import { HasName } from '../util/Name.js';
import { ZTKParser } from '../zeda/ZTKParser.js';
import { Frame } from './Frame.js';
import { OpticalInfo } from './OpticalInfo.js';
import { GeometryFactory } from './GeometryFactory.js';

export class Shape implements HasName {
  name: string = 'noanme';
  geometry: BufferGeometry = new BufferGeometry();
  material: Material = new MeshBasicMaterial();

  getMesh(this: Shape): Mesh {
    const mesh = new Mesh(this.geometry, this.material);
    mesh.name = this.name;
    return mesh;
  }

  fromZTK(this: Shape, parser: ZTKParser, materials: Array<OpticalInfo>): void {
    type ReadPrp = {
      name: string;
      type: string;
      optic: string;
      frame: Frame;
    };

    const prp: ReadPrp = {
      name: 'noname',
      type: '',
      optic: '',
      frame: new Frame(),
    };

    parser.evaluateKey(
      {
        'name': {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void => {
            obj.name = parser.getValue() ?? obj.name;
          },
          num: 1,
        },
        'type': {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void => {
            obj.type = parser.getValue() ?? obj.type;
          },
          num: 1,
        },
        'optic': {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void => {
            obj.optic = parser.getValue() ?? obj.optic;
          },
          num: 1,
        },
        'pos': {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void =>
            obj.frame.posFromZTK(parser),
          num: 1,
        },
        'att': {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void =>
            obj.frame.attFromZTK(parser),
          num: 1,
        },
        'frame': {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void =>
            obj.frame.fromZTK(parser),
          num: 1,
        },
      },
      prp,
    );

    this.name = prp.name;

    this.geometry = GeometryFactory.fromZTK(prp.type, parser) ?? new BufferGeometry();
    this.geometry.translate(prp.frame.pos.x, prp.frame.pos.y, prp.frame.pos.z);
    this.geometry.applyQuaternion(prp.frame.att);

    const optic = materials.find((v: OpticalInfo, _index: number) => v.name == prp.optic);
    this.material = optic?.material ?? new Material();
  }
}
