import {
  validateWindowWidth,
  WindowLevel
} from '../../src/image/windowLevel';

/**
 * Tests for the 'image/voiLut.js' file.
 */
// Do not warn if these variables were not defined before.
/* global QUnit */

/**
 * Tests for {@link WindowLevel}.
 *
 * @function module:tests/image~WindowLevel
 */
QUnit.test('Test WindowLevel.', function (assert) {
  const wcaw00 = new WindowLevel(0, 2);
  assert.equal(wcaw00.center, 0, 'Window level getCenter.');
  assert.equal(wcaw00.width, 2, 'Window level getWidth.');

  assert.throws(function () {
    new WindowLevel(0, 0);
  },
  new Error('Window width shall always be greater than or equal to 1'),
  'WindowLevel with 0 width.');
});

/**
 * Tests for validateWindowWidth.
 *
 * @function module:tests/image~validateWindowWidth
 */
QUnit.test('Test validateWindowWidth.', function (assert) {
  assert.equal(validateWindowWidth(1), 1, 'Validate width #0');
  assert.equal(validateWindowWidth(10), 10, 'Validate width #1');
  assert.equal(validateWindowWidth(0), 1, 'Validate zero width');
  assert.equal(validateWindowWidth(-1), 1, 'Validate negative width');
});
