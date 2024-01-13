import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  SphereGeometry,
  Vector3,
} from 'three'
import { ZTKParser } from '../zeda/ZTKParser.js'
import { Frame } from './Frame.js'

export class GeometryFactory {
  static readonly generator: { [key: string]: (parser: ZTKParser) => [BufferGeometry, Frame] } = {
    box: GeometryFactory.boxFromZTK,
    cone: GeometryFactory.coneFromZTK,
    cylinder: GeometryFactory.cylinderFromZTK,
    sphere: GeometryFactory.sphereFromZTK,
    polyhedron: GeometryFactory.polyhedronFromZTK,
  }

  static fromZTK(type: string, parser: ZTKParser): BufferGeometry | undefined {
    if (type in GeometryFactory.generator) {
      const [geo, frame] = GeometryFactory.generator[type](parser)
      geo.translate(frame.pos.x, frame.pos.y, frame.pos.z)
      geo.applyQuaternion(frame.att)
      return geo
    }
  }

  static boxFromZTK(parser: ZTKParser): [BoxGeometry, Frame] {
    type ReadPrp = {
      center: Vector3
      axes: [Vector3, Vector3, Vector3]
      depth: number
      width: number
      height: number
      autoId: number | undefined
    }

    const prp: ReadPrp = {
      center: new Vector3(),
      axes: [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)],
      depth: 0,
      width: 0,
      height: 0,
      autoId: undefined,
    }
    parser.evaluateKey(
      {
        center: {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void => {
            const v = parser.getNumbers(3)
            obj.center.set(v[0], v[1], v[2])
          },
          num: 1,
        },
        ax: {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void => {
            const v = parser.getValue()
            if (v == 'auto') {
              obj.autoId = obj.autoId === undefined ? 0 : -1
            } else {
              const v1 = parser.getNumber()
              const v2 = parser.getNumber()
              obj.axes[0].set(Number(v), v1, v2).normalize()
            }
          },
          num: 1,
        },
        ay: {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void => {
            const v = parser.getValue()
            if (v == 'auto') {
              obj.autoId = obj.autoId === undefined ? 1 : -1
            } else {
              const v1 = parser.getNumber()
              const v2 = parser.getNumber()
              obj.axes[1].set(Number(v), v1, v2).normalize()
            }
          },
          num: 1,
        },
        az: {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void => {
            const v = parser.getValue()
            if (v == 'auto') {
              obj.autoId = obj.autoId === undefined ? 2 : -1
            } else {
              const v1 = parser.getNumber()
              const v2 = parser.getNumber()
              obj.axes[2].set(Number(v), v1, v2).normalize()
            }
          },
          num: 1,
        },
        depth: {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void => {
            obj.depth = parser.getNumber()
          },
          num: 1,
        },
        width: {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void => {
            obj.width = parser.getNumber()
          },
          num: 1,
        },
        height: {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void => {
            obj.height = parser.getNumber()
          },
          num: 1,
        },
      },
      prp,
    )

    const frame = new Frame(prp.center)
    if (prp.autoId) {
      if (prp.autoId >= 0) {
        prp.axes[prp.autoId] = prp.axes[(prp.autoId + 1) % 3].cross(prp.axes[(prp.autoId + 2) % 3])
        frame.setAttFromVectors(prp.axes)
      }
    } else {
      frame.setAttFromVectors(prp.axes)
    }

    return [new BoxGeometry(prp.width, prp.height, prp.depth), frame]
  }

  static coneFromZTK(parser: ZTKParser): [ConeGeometry, Frame] {
    type ReadPrp = {
      center: Vector3
      vert: Vector3
      radius: number
      div: number
    }

    const prp: ReadPrp = {
      center: new Vector3(),
      vert: new Vector3(),
      radius: 0,
      div: 32,
    }
    parser.evaluateKey(
      {
        center: {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void => {
            const v = parser.getNumbers(3)
            obj.center.set(v[0], v[1], v[2])
          },
          num: 1,
        },
        vert: {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void => {
            const v = parser.getNumbers(3)
            obj.vert.set(v[0], v[1], v[2])
          },
          num: 1,
        },
        radius: {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void => {
            obj.radius = parser.getNumber()
          },
          num: 1,
        },
        div: {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void => {
            obj.div = parser.getNumber()
          },
          num: 1,
        },
      },
      prp,
    )

    const dir = new Vector3().subVectors(prp.vert, prp.center)
    const height = dir.length()
    const frame = new Frame(prp.center)
    frame.pos = prp.center.add(prp.vert).divideScalar(2)
    frame.att.setFromUnitVectors(new Vector3(0, 1, 0), dir.normalize())
    return [new ConeGeometry(prp.radius, height, prp.div), frame]
  }

  static cylinderFromZTK(parser: ZTKParser): [CylinderGeometry, Frame] {
    type ReadPrp = {
      center: [Vector3, Vector3]
      radius: number
      div: number
    }

    const prp: ReadPrp = {
      center: [new Vector3(), new Vector3()],
      radius: 0,
      div: 32,
    }
    parser.evaluateKey(
      {
        center: {
          evaluator: (parser: ZTKParser, obj: ReadPrp, index: number): void => {
            const v = parser.getNumbers(3)
            obj.center[index].set(v[0], v[1], v[2])
          },
          num: 2,
        },
        radius: {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void => {
            obj.radius = parser.getNumber()
          },
          num: 1,
        },
        div: {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void => {
            obj.div = parser.getNumber()
          },
          num: 1,
        },
      },
      prp,
    )

    const dir = new Vector3().subVectors(prp.center[1], prp.center[0])
    const height = dir.length()
    const frame = new Frame()
    frame.pos = prp.center[0].add(prp.center[1]).divideScalar(2)
    frame.att.setFromUnitVectors(new Vector3(0, 1, 0), dir.normalize())
    return [new CylinderGeometry(prp.radius, prp.radius, height, prp.div), frame]
  }

  static sphereFromZTK(parser: ZTKParser): [SphereGeometry, Frame] {
    type ReadPrp = {
      center: Vector3
      radius: number
      div: number
    }

    const prp: ReadPrp = {
      center: new Vector3(),
      radius: 0,
      div: 32,
    }
    parser.evaluateKey(
      {
        center: {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void => {
            const v = parser.getNumbers(3)
            obj.center.set(v[0], v[1], v[2])
          },
          num: 1,
        },
        radius: {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void => {
            obj.radius = parser.getNumber()
          },
          num: 1,
        },
        div: {
          evaluator: (parser: ZTKParser, obj: ReadPrp, _index: number): void => {
            obj.div = parser.getNumber()
          },
          num: 1,
        },
      },
      prp,
    )

    const frame = new Frame(prp.center)
    return [new SphereGeometry(prp.radius, prp.div, prp.div), frame]
  }

  static polyhedronFromZTK(parser: ZTKParser): [BufferGeometry, Frame] {
    type ReadPrp = {
      vertices: Float32Array
      indices: Array<number>
    }

    const vertNum = parser.countKey('vert')
    const faceNum = parser.countKey('face')
    const prp: ReadPrp = {
      vertices: new Float32Array(vertNum * 3),
      indices: new Array<number>(faceNum * 3),
    }

    parser.evaluateKey(
      {
        vert: {
          evaluator: (parser: ZTKParser, obj: ReadPrp, index: number): void => {
            const id = parser.getNumber()
            if (id !== index) {
              console.warn(`ZTKParser: unmatched identifier of a vertex, ${id} !== ${index}`)
            }
            const v = parser.getNumbers(3)
            obj.vertices[3 * index] = v[0]
            obj.vertices[3 * index + 1] = v[1]
            obj.vertices[3 * index + 2] = v[2]
          },
          num: vertNum,
        },
        face: {
          evaluator: (parser: ZTKParser, obj: ReadPrp, index: number): void => {
            const v = parser.getNumbers(3)
            obj.indices[3 * index] = v[0]
            obj.indices[3 * index + 1] = v[1]
            obj.indices[3 * index + 2] = v[2]
          },
          num: faceNum,
        },
      },
      prp,
    )

    const geometry = new BufferGeometry()
    geometry.setIndex(prp.indices)
    geometry.setAttribute('position', new BufferAttribute(prp.vertices, 3))
    geometry.computeVertexNormals()
    return [geometry, new Frame()]
  }
}
