import {Vector3D} from './vector';
import {Point3D} from './point';
import {Index} from './index';
import {logger} from '../utils/logger';

// Number.EPSILON is difference between 1 and the smallest
// floating point number greater than 1
// -> ~2e-16
// BIG_EPSILON -> ~2e-12
export const BIG_EPSILON = Number.EPSILON * 1e4;
// 'real world', for example when comparing positions
export const REAL_WORLD_EPSILON = 1e-4;

/**
 * Check if two numbers are similar.
 *
 * @param {number} a The first number.
 * @param {number} b The second number.
 * @param {number} tol The comparison tolerance,
 *   default to Number.EPSILON.
 * @returns {boolean} True if similar.
 */
export function isSimilar(a, b, tol) {
  if (typeof tol === 'undefined') {
    tol = Number.EPSILON;
  }
  return Math.abs(a - b) < tol;
}

/**
 * Immutable 3x3 Matrix.
 */
export class Matrix33 {

  /**
   * Matrix values.
   *
   * @type {number[]}
   */
  #values;

  /**
   * Matrix inverse, calculated at first ask
   *
   * @type {Matrix33}
   */
  #inverse;

  /**
   * @param {number[]} values row-major ordered 9 values.
   */
  constructor(values) {
    this.#values = values;
  }

  /**
   * Get a value of the matrix.
   *
   * @param {number} row The row at wich to get the value.
   * @param {number} col The column at wich to get the value.
   * @returns {number|undefined} The value at the position.
   */
  get(row, col) {
    return this.#values[row * 3 + col];
  }

  /**
   * Get the inverse of this matrix.
   *
   * @returns {Matrix33|undefined} The inverse matrix or undefined
   *   if the determinant is zero.
   */
  getInverse() {
    if (typeof this.#inverse === 'undefined') {
      this.#inverse = getMatrixInverse(this);
    }
    return this.#inverse;
  }

  /**
   * Check for Matrix33 equality.
   *
   * @param {Matrix33} rhs The other matrix to compare to.
   * @param {number} [p] A numeric expression for the precision to use in check
   *   (ex: 0.001). Defaults to Number.EPSILON if not provided.
   * @returns {boolean} True if both matrices are equal.
   */
  equals(rhs, p) {
    // TODO: add type check
    // check values
    for (let i = 0; i < 3; ++i) {
      for (let j = 0; j < 3; ++j) {
        if (!isSimilar(this.get(i, j), rhs.get(i, j), p)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Get a string representation of the Matrix33.
   *
   * @returns {string} The matrix as a string.
   */
  toString() {
    let str = '[';
    for (let i = 0; i < 3; ++i) {
      if (i !== 0) {
        str += ', \n ';
      }
      for (let j = 0; j < 3; ++j) {
        if (j !== 0) {
          str += ', ';
        }
        str += this.get(i, j);
      }
    }
    str += ']';
    return str;
  }

  /**
   * Multiply this matrix by another.
   *
   * @param {Matrix33} rhs The matrix to multiply by.
   * @returns {Matrix33} The product matrix.
   */
  multiply(rhs) {
    const values = [];
    for (let i = 0; i < 3; ++i) {
      for (let j = 0; j < 3; ++j) {
        let tmp = 0;
        for (let k = 0; k < 3; ++k) {
          tmp += this.get(i, k) * rhs.get(k, j);
        }
        values.push(tmp);
      }
    }
    return new Matrix33(values);
  }

  /**
   * Get the absolute value of this matrix.
   *
   * @returns {Matrix33} The result matrix.
   */
  getAbs() {
    const values = [];
    for (let i = 0; i < 3; ++i) {
      for (let j = 0; j < 3; ++j) {
        values.push(Math.abs(this.get(i, j)));
      }
    }
    return new Matrix33(values);
  }

  /**
   * Multiply this matrix by a 3D array.
   *
   * @param {number[]} array3D The input 3D array.
   * @returns {number[]} The result 3D array.
   */
  multiplyArray3D(array3D) {
    if (array3D.length !== 3) {
      throw new Error('Cannot multiply 3x3 matrix with non 3D array: ' +
        array3D.length);
    }
    const values = [];
    for (let i = 0; i < 3; ++i) {
      let tmp = 0;
      for (let j = 0; j < 3; ++j) {
        tmp += this.get(i, j) * array3D[j];
      }
      values.push(tmp);
    }
    return values;
  }

  /**
   * Multiply this matrix by a 3D vector.
   *
   * @param {Vector3D} vector3D The input 3D vector.
   * @returns {Vector3D} The result 3D vector.
   */
  multiplyVector3D(vector3D) {
    const array3D = this.multiplyArray3D(
      [vector3D.getX(), vector3D.getY(), vector3D.getZ()]
    );
    return new Vector3D(array3D[0], array3D[1], array3D[2]);
  }

  /**
   * Multiply this matrix by a 3D point.
   *
   * @param {Point3D} point3D The input 3D point.
   * @returns {Point3D} The result 3D point.
   */
  multiplyPoint3D(point3D) {
    const array3D = this.multiplyArray3D(
      [point3D.getX(), point3D.getY(), point3D.getZ()]
    );
    return new Point3D(array3D[0], array3D[1], array3D[2]);
  }

  /**
   * Multiply this matrix by a 3D index.
   *
   * @param {Index} index3D The input 3D index.
   * @returns {Index} The result 3D index.
   */
  multiplyIndex3D(index3D) {
    const array3D = this.multiplyArray3D(index3D.getValues());
    return new Index(array3D);
  }

  /**
   * Get the index of the maximum in absolute value of a row.
   *
   * @param {number} row The row to get the maximum from.
   * @returns {object} The {value,index} of the maximum.
   */
  getRowAbsMax(row) {
    const values = [
      Math.abs(this.get(row, 0)),
      Math.abs(this.get(row, 1)),
      Math.abs(this.get(row, 2))
    ];
    const absMax = Math.max.apply(null, values);
    const index = values.indexOf(absMax);
    return {
      value: this.get(row, index),
      index: index
    };
  }

  /**
   * Get the index of the maximum in absolute value of a column.
   *
   * @param {number} col The column to get the maximum from.
   * @returns {object} The {value,index} of the maximum.
   */
  getColAbsMax(col) {
    const values = [
      Math.abs(this.get(0, col)),
      Math.abs(this.get(1, col)),
      Math.abs(this.get(2, col))
    ];
    const absMax = Math.max.apply(null, values);
    const index = values.indexOf(absMax);
    return {
      value: this.get(index, col),
      index: index
    };
  }

  /**
   * Get this matrix with only zero and +/- ones instead of the maximum,
   *
   * @returns {Matrix33} The simplified matrix.
   */
  asOneAndZeros() {
    const res = [];
    for (let j = 0; j < 3; ++j) {
      const max = this.getRowAbsMax(j);
      const sign = max.value > 0 ? 1 : -1;
      for (let i = 0; i < 3; ++i) {
        if (i === max.index) {
          //res.push(1);
          res.push(1 * sign);
        } else {
          res.push(0);
        }
      }
    }
    return new Matrix33(res);
  }

  /**
   * Get the third column direction index of an orientation matrix.
   *
   * @returns {number} The index of the absolute maximum of the last column.
   */
  getThirdColMajorDirection() {
    return this.getColAbsMax(2).index;
  }

} // Matrix33

/**
 * Get the inverse of an input 3*3 matrix.
 *
 * @param {Matrix33} m The input matrix.
 * @returns {Matrix33|undefined} The inverse matrix or undefined
 *   if the determinant is zero.
 * @see https://en.wikipedia.org/wiki/Invertible_matrix#Inversion_of_3_%C3%97_3_matrices
 * @see https://github.com/willnode/N-Matrix-Programmer
 */
function getMatrixInverse(m) {
  const m00 = m.get(0, 0);
  const m01 = m.get(0, 1);
  const m02 = m.get(0, 2);
  const m10 = m.get(1, 0);
  const m11 = m.get(1, 1);
  const m12 = m.get(1, 2);
  const m20 = m.get(2, 0);
  const m21 = m.get(2, 1);
  const m22 = m.get(2, 2);

  const a1212 = m11 * m22 - m12 * m21;
  const a2012 = m12 * m20 - m10 * m22;
  const a0112 = m10 * m21 - m11 * m20;

  let det = m00 * a1212 + m01 * a2012 + m02 * a0112;
  if (det === 0) {
    logger.warn('Cannot invert 3*3 matrix with zero determinant.');
    return undefined;
  }
  det = 1 / det;

  const values = [
    det * a1212,
    det * (m02 * m21 - m01 * m22),
    det * (m01 * m12 - m02 * m11),
    det * a2012,
    det * (m00 * m22 - m02 * m20),
    det * (m02 * m10 - m00 * m12),
    det * a0112,
    det * (m01 * m20 - m00 * m21),
    det * (m00 * m11 - m01 * m10)
  ];

  return new Matrix33(values);
}

/**
 * Create a 3x3 identity matrix.
 *
 * @returns {Matrix33} The identity matrix.
 */
export function getIdentityMat33() {
  /* eslint-disable array-element-newline */
  return new Matrix33([
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
  ]);
  /* eslint-enable array-element-newline */
}

/**
 * Check if a matrix is a 3x3 identity matrix.
 *
 * @param {Matrix33} mat33 The matrix to test.
 * @returns {boolean} True if identity.
 */
export function isIdentityMat33(mat33) {
  return mat33.equals(getIdentityMat33());
}

/**
 * Create a 3x3 coronal (xzy) matrix.
 *
 * @returns {Matrix33} The coronal matrix.
 */
export function getCoronalMat33() {
  /* eslint-disable array-element-newline */
  return new Matrix33([
    1, 0, 0,
    0, 0, 1,
    0, -1, 0
  ]);
  /* eslint-enable array-element-newline */
}

/**
 * Create a 3x3 sagittal (yzx) matrix.
 *
 * @returns {Matrix33} The sagittal matrix.
 */
export function getSagittalMat33() {
  /* eslint-disable array-element-newline */
  return new Matrix33([
    0, 0, -1,
    1, 0, 0,
    0, -1, 0
  ]);
  /* eslint-enable array-element-newline */
}

/**
 * Default anatomical plane orientations.
 */
export const Orientation = {
  /**
   * Axial, also known as transverse.
   */
  Axial: 'axial',
  /**
   * Coronal, also known as frontal.
   */
  Coronal: 'coronal',
  /**
   * Sagittal, also known as anteroposterior.
   */
  Sagittal: 'sagittal'
};

/**
 * Get an orientation matrix from a name.
 *
 * @param {string} name The orientation name.
 * @returns {Matrix33|undefined} The orientation matrix.
 */
export function getMatrixFromName(name) {
  let matrix;
  if (name === Orientation.Axial) {
    matrix = getIdentityMat33();
  } else if (name === Orientation.Coronal) {
    matrix = getCoronalMat33();
  } else if (name === Orientation.Sagittal) {
    matrix = getSagittalMat33();
  }
  return matrix;
}

/**
 * Get the orientation code of an orientation matrix. Each letter defines
 * the towards direction. Letters are: R (right), L (left),
 * A (anterior), P (posterior), I (inferior) and S (superior).
 *
 * @param {Matrix33} matrix The orientation matrix.
 * @returns {string} The orientation code.
 */
export function getOrientationStringLPS(matrix) {
  const v0 = new Vector3D(
    matrix.get(0, 0),
    matrix.get(1, 0),
    matrix.get(2, 0)
  );
  const v1 = new Vector3D(
    matrix.get(0, 1),
    matrix.get(1, 1),
    matrix.get(2, 1)
  );
  const v2 = new Vector3D(
    matrix.get(0, 2),
    matrix.get(1, 2),
    matrix.get(2, 2)
  );
  return getVectorStringLPS(v0) +
    getVectorStringLPS(v1) +
    getVectorStringLPS(v2);
}

/**
 * Get the orientation code of an orientation vector.
 * Credits: David Clunie, https://www.dclunie.com/medical-image-faq/html/part2.html
 *
 * @param {*} vector The orientation vector.
 * @returns {string} The orientation code.
 */
function getVectorStringLPS(vector) {
  let abs = new Vector3D(
    Math.abs(vector.getX()),
    Math.abs(vector.getY()),
    Math.abs(vector.getZ())
  );

  let orientation = '';
  const orientationX = vector.getX() < 0 ? 'R' : 'L';
  const orientationY = vector.getY() < 0 ? 'A' : 'P';
  // as defined in DICOM
  //const orientationZ = vector.getZ() < 0 ? 'F' : 'H';
  const orientationZ = vector.getZ() < 0 ? 'I' : 'S';

  const threshold = 0.0001;

  for (let i = 0; i < 3; i++) {
    if (abs.getX() > threshold &&
      abs.getX() > abs.getY() &&
      abs.getX() > abs.getZ()) {
      orientation += orientationX;
      abs = new Vector3D(0, abs.getY(), abs.getZ());
    } else if (abs.getY() > threshold &&
      abs.getY() > abs.getX() &&
      abs.getY() > abs.getZ()) {
      orientation += orientationY;
      abs = new Vector3D(abs.getX(), 0, abs.getZ());
    } else if (abs.getZ() > threshold &&
      abs.getZ() > abs.getX() &&
      abs.getZ() > abs.getY()) {
      orientation += orientationZ;
      abs = new Vector3D(abs.getX(), abs.getY(), 0);
    } else {
      break;
    }
  }

  return orientation;
}