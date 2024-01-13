import { Vector3, Quaternion, Matrix4, Matrix3 } from 'three'
import { MathUtils } from 'three'
import { ZTKParser } from '../../src/zeda/ZTKParser.js'
import { GeometryFactory } from '../../src/zeo/GeometryFactory.js'
import { expectCloseToVector3, expectCloseToQuaternion } from '../util/expectArray.js'

describe('GeometryFactory', () => {
  test('box', () => {
    const parser = new ZTKParser()
    parser.parse(`
            center : 0.1, 0.2, 0.3
            depth : 0.1
            width : 0.2
            height : 0.3
        `)

    const result = GeometryFactory.boxFromZTK(parser)
    expect(result).toBeDefined()
    if (result === undefined) return
    const [geo, frame] = result
    expect(geo.type).toBe('BoxGeometry')
    expect(geo.parameters.depth).toBe(0.1)
    expect(geo.parameters.width).toBe(0.2)
    expect(geo.parameters.height).toBe(0.3)
    expectCloseToVector3(frame.pos, new Vector3(0.1, 0.2, 0.3))
  })

  test('cone', () => {
    const parser = new ZTKParser()
    parser.parse(`
            center : 0.1, 0.2, 0.3
            vert : 0.1, 0.2, 0.5
            radius : 0.05
            div: 16
        `)

    const result = GeometryFactory.coneFromZTK(parser)
    expect(result).toBeDefined()
    if (result === undefined) return
    const [geo, frame] = result
    expect(geo.type).toBe('ConeGeometry')
    expect(geo.parameters.height).toBe(0.2)
    expect(geo.parameters.radius).toBe(0.05)
    expect(geo.parameters.radialSegments).toBe(16)
    expect(geo.parameters.heightSegments).toBe(1)
    expectCloseToVector3(frame.pos, new Vector3(0.1, 0.2, 0.4))
    expectCloseToQuaternion(
      frame.att,
      new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(0, 0, 1)),
    )
  })

  test('cylinder', () => {
    const parser = new ZTKParser()
    parser.parse(`
            center : 0.1, 0.2, 0.3
            center : 0.1, 0.2, 0.5
            radius : 0.05
            div: 16
        `)

    const result = GeometryFactory.cylinderFromZTK(parser)
    expect(result).toBeDefined()
    if (result === undefined) return
    const [geo, frame] = result
    expect(geo.type).toBe('CylinderGeometry')
    expect(geo.parameters.height).toBe(0.2)
    expect(geo.parameters.radiusTop).toBe(0.05)
    expect(geo.parameters.radiusBottom).toBe(0.05)
    expect(geo.parameters.radialSegments).toBe(16)
    expect(geo.parameters.heightSegments).toBe(1)
    expectCloseToVector3(frame.pos, new Vector3(0.1, 0.2, 0.4))
    expectCloseToQuaternion(
      frame.att,
      new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(0, 0, 1)),
    )
  })

  test('sphere', () => {
    const parser = new ZTKParser()
    parser.parse(`
            center : 0.1, 0.2, 0.3
            radius : 0.05
            div: 16
        `)

    const result = GeometryFactory.sphereFromZTK(parser)
    expect(result).toBeDefined()
    if (result === undefined) return
    const [geo, frame] = result
    expect(geo.type).toBe('SphereGeometry')
    expect(geo.parameters.radius).toBe(0.05)
    expect(geo.parameters.heightSegments).toBe(16)
    expectCloseToVector3(frame.pos, new Vector3(0.1, 0.2, 0.3))
    expectCloseToQuaternion(frame.att, new Quaternion())
  })

  test('polyhedron', () => {
    const parser = new ZTKParser()
    parser.parse(`
            vert: 0 { 0.1, 0.1, 0.1 }
            vert: 1 { -0.1, 0.1, 0.1 }
            vert: 2 { -0.1, -0.1, 0.1 }
            vert: 3 { 0.1, -0.1, 0.1 }
            vert: 4 { 0.1, 0.1, -0.1 }
            vert: 5 { -0.1, 0.1, -0.1 }
            vert: 6 { -0.1, -0.1, -0.1 }
            vert: 7 { 0.1, -0.1, -0.1 }
            face: 0 1 2
            face: 0 2 3
            face: 0 4 5
            face: 0 5 1
            face: 1 5 6
            face: 1 6 2
            face: 2 6 7
            face: 2 7 3
            face: 3 7 4
            face: 3 4 0
            face: 7 6 5
            face: 7 5 4
        `)
    const result = GeometryFactory.polyhedronFromZTK(parser)
    expect(result).toBeDefined()
    if (result === undefined) return
    const [geo, frame] = result
    expect(geo.type).toBe('BufferGeometry')
    expectCloseToVector3(frame.pos, new Vector3())
    expectCloseToQuaternion(frame.att, new Quaternion())
  })
})
