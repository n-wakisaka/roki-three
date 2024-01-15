import { Vector3, Matrix3 } from 'three';

export class MP {
  mass = 0.0;
  com = new Vector3();
  inertia = new Matrix3();
}

export class Body {
  mp = new MP();
  stuff: string | undefined;
}
