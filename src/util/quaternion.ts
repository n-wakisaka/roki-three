import { Vector3, Quaternion } from 'three';

// https://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToAngle/index.htm
export function quaternionToAxisAngle(quat: Quaternion): [Vector3, number] {
  if (quat.w > 1) quat.normalize();
  const angle = 2 * Math.acos(quat.w);
  const s = Math.sqrt(1 - quat.w * quat.w);
  const v = new Vector3(quat.x, quat.y, quat.z);
  if (s < 0.0001) {
    return [v, angle];
  } else {
    return [v.divideScalar(s), angle];
  }
}
