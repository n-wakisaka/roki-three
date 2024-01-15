import { Vector3, Quaternion } from 'three';

export function expectCloseToVector3(vec1: Vector3, vec2: Vector3) {
  expect(vec1.x).toBeCloseTo(vec2.x);
  expect(vec1.y).toBeCloseTo(vec2.y);
  expect(vec1.z).toBeCloseTo(vec2.z);
}

export function expectCloseToQuaternion(quat1: Quaternion, quat2: Quaternion) {
  expect(quat1.x).toBeCloseTo(quat2.x);
  expect(quat1.y).toBeCloseTo(quat2.y);
  expect(quat1.z).toBeCloseTo(quat2.z);
  expect(quat1.w).toBeCloseTo(quat2.w);
}
