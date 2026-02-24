import { Color, Material, MeshBasicMaterial, MeshPhongMaterial, DoubleSide } from 'three';
import { HasName } from '../util/Name.js';
import { ZTKParser } from '../zeda/ZTKParser.js';

export class OpticalInfo implements HasName {
  name: string = 'noname';
  material: Material = new MeshBasicMaterial();

  fromZTK(this: OpticalInfo, parser: ZTKParser): void {
    type RGB = [number, number, number];
    type ReadPrp = {
      name: string;
      ambient: RGB;
      diffuse: RGB;
      specular: RGB;
      shininess: number;
      alpha: number;
    };

    const prp: ReadPrp = {
      name: 'noname',
      ambient: [1, 1, 1],
      diffuse: [1, 1, 1],
      specular: [1, 1, 1],
      shininess: 0,
      alpha: 1,
    };

    parser.evaluateKey(
      {
        'name': {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void => {
            obj.name = parser.getValue() ?? obj.name;
          },
          num: 1,
        },
        'ambient': {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void => {
            const v = parser.getNumbers(3);
            obj.ambient = [v[0], v[1], v[2]];
          },
          num: 1,
        },
        'diffuse': {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void => {
            const v = parser.getNumbers(3);
            obj.diffuse = [v[0], v[1], v[2]];
          },
          num: 1,
        },
        'specular': {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void => {
            const v = parser.getNumbers(3);
            obj.specular = [v[0], v[1], v[2]];
          },
          num: 1,
        },
        'shininess': {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void => {
            obj.shininess = parser.getNumber();
          },
          num: 1,
        },
        'alpha': {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void => {
            obj.alpha = parser.getNumber();
          },
          num: 1,
        },
      },
      prp,
    );

    this.name = prp.name;
    this.material = new MeshPhongMaterial({
      name: prp.name,
      color: new Color(prp.diffuse[0], prp.diffuse[1], prp.diffuse[2]),
      specular: new Color(prp.specular[0], prp.specular[1], prp.specular[2]),
      shininess: prp.shininess * 100,
      opacity: prp.alpha,
      transparent: prp.alpha != 1,
      side: DoubleSide,
      // NOTE: ambientカラーをemissiveに入れるかどうか
      emissive: new Color(prp.ambient[0], prp.ambient[1], prp.ambient[2]),
    });
  }
}
