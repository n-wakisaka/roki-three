import { Vector3, Quaternion, Euler, Matrix4, Matrix3 } from 'three'
import { MathUtils } from 'three'
import { ZTKParser } from '../../src/zeda/ZTKParser.js'
import { Frame } from '../../src/zeo/Frame.js'
import { expectCloseToVector3, expectCloseToQuaternion } from '../util/expectArray.js'

describe('Frame', () => {
  test('copy', () => {
    const frame = new Frame(
      new Vector3(1, 2, 3),
      new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), MathUtils.degToRad(60)),
    )
    const copy = new Frame()
    frame.copy(copy)

    expect(copy).toStrictEqual(frame)
  })

  test('clone', () => {
    const frame = new Frame(
      new Vector3(1, 2, 3),
      new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), MathUtils.degToRad(60)),
    )
    const clone = frame.clone()

    expect(clone).toStrictEqual(frame)
  })

  test('applyVector', () => {
    // z軸に90度回転させる
    const r = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), MathUtils.degToRad(90))
    expectCloseToVector3(new Vector3(1, 0, 0).applyQuaternion(r), new Vector3(0, 1, 0))
    expectCloseToVector3(new Vector3(0, 1, 0).applyQuaternion(r), new Vector3(-1, 0, 0))
    expectCloseToVector3(new Vector3(0, 0, 1).applyQuaternion(r), new Vector3(0, 0, 1))
  })

  test('fromZTK', () => {
    const parser = new ZTKParser()
    // z軸に90度回転した座標系を表すFrame
    parser.parse(
      `
            frame: 0.0, -1.0, 0.0, 1.0
                   1.0, 0.0, 0.0, 2.0
                   0.0, 0.0, 1.0, 3.0
            `,
    )
    const frame = new Frame()
    frame.fromZTK(parser)

    expectCloseToVector3(frame.pos, new Vector3(1, 2, 3))
    expectCloseToQuaternion(
      frame.att,
      new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), MathUtils.degToRad(90)),
    )
  })

  test('posFromZTK', () => {
    const parser = new ZTKParser()
    parser.parse(
      `
            pos: {1.0, 2.0, 3.0}
            `,
    )
    const frame = new Frame()
    frame.posFromZTK(parser)
    expectCloseToVector3(frame.pos, new Vector3(1, 2, 3))
  })

  test('attFromZTK-Ident', () => {
    const parser = new ZTKParser()
    parser.parse(
      `
            att: 1.0, 0.0, 0.0
                 0.0, 1.0, 0.0
                 0.0, 0.0, 1.0
            `,
    )
    const frame = new Frame()
    frame.attFromZTK(parser)
    expectCloseToQuaternion(frame.att, new Quaternion())
  })

  test('attFromZTK-Rot90-z', () => {
    const parser = new ZTKParser()
    parser.parse(
      `
            att: 0.0, -1.0, 0.0
                 1.0, 0.0, 0.0
                 0.0, 0.0, 1.0
            `,
    )
    const frame = new Frame()
    frame.attFromZTK(parser)
    expectCloseToQuaternion(
      frame.att,
      new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), MathUtils.degToRad(90)),
    )
  })
})
