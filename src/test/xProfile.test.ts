// Unit Tests for X Profile Validation, Normalization, and MOC ID Persistence
import {
  cleanUsername,
  isValidXUsername,
  normalizeAvatarUrl,
  calculateMocId
} from '../lib/xProfileUtils';

// Helper assertion function
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export function runAllTests() {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  function test(name: string, fn: () => void) {
    try {
      fn();
      results.push({ name, passed: true });
    } catch (err: any) {
      results.push({ name, passed: false, error: err.message });
    }
  }

  // 1. Valid Username
  test('Valid username accepted', () => {
    assert(isValidXUsername('vitalik') === true, 'vitalik should be valid');
    assert(isValidXUsername('sandeep_nailwal') === true, 'sandeep_nailwal should be valid');
    assert(isValidXUsername('MOC_2026') === true, 'MOC_2026 should be valid');
  });

  // 2. @ Prefix
  test('@ prefix cleaned automatically', () => {
    assert(cleanUsername('@vitalik') === 'vitalik', '@vitalik should become vitalik');
    assert(cleanUsername('@@@vitalik') === 'vitalik', '@@@vitalik should become vitalik');
    assert(isValidXUsername('@vitalik') === true, '@vitalik should validate true after cleaning');
  });

  // 3. Invalid Characters
  test('Invalid characters rejected', () => {
    assert(isValidXUsername('vitalik!') === false, 'exclamation mark rejected');
    assert(isValidXUsername('vitalik buterin') === false, 'spaces rejected');
    assert(isValidXUsername('user$name') === false, 'symbols rejected');
  });

  // 4. Username > 15 characters
  test('Username longer than 15 characters rejected', () => {
    assert(isValidXUsername('this_username_is_way_too_long') === false, '> 15 chars rejected');
    assert(isValidXUsername('fifteen_char_ok') === true, '15 chars accepted');
  });

  // 5. Empty Username
  test('Empty username rejected', () => {
    assert(isValidXUsername('') === false, 'empty string rejected');
    assert(isValidXUsername('   ') === false, 'whitespace string rejected');
  });

  // 6. Avatar normalization to 400x400
  test('Profile avatar converted from _normal to _400x400', () => {
    const raw = 'https://pbs.twimg.com/profile_images/12345/pic_normal.jpg';
    const expected = 'https://pbs.twimg.com/profile_images/12345/pic_400x400.jpg';
    assert(normalizeAvatarUrl(raw) === expected, 'normal size upgraded to 400x400');
    assert(normalizeAvatarUrl(null) === null, 'null avatar handled gracefully');
  });

  // 7. Deterministic MOC ID separate from X User ID
  test('MOC ID is separate integer from X User ID', () => {
    const xUserId = '783214';
    const mocId = calculateMocId(xUserId);
    assert(typeof mocId === 'number', 'MOC ID must be a number');
    assert(mocId >= 100 && mocId <= 9000, 'MOC ID within valid bounds');
    assert(String(mocId) !== xUserId, 'MOC ID is distinct from X user ID');
  });

  // 8. Username change with identical X User ID preserves MOC ID
  test('Same X User ID preserves MOC ID across username changes', () => {
    const xUserId = '99887766';
    const id1 = calculateMocId(xUserId);
    const id2 = calculateMocId(xUserId);
    assert(id1 === id2, 'MOC ID remains identical for same X User ID');
  });

  return results;
}

const testResults = runAllTests();
let allPassed = true;
console.log('\n--- MUMBAI ONCHAIN X PROFILE & ID TESTS ---');
for (const r of testResults) {
  if (r.passed) {
    console.log(`✓ ${r.name}`);
  } else {
    allPassed = false;
    console.error(`✗ ${r.name}: ${r.error}`);
  }
}
console.log(`\nTotal: ${testResults.length}, Passed: ${testResults.filter(r => r.passed).length}, Failed: ${testResults.filter(r => !r.passed).length}\n`);

if (!allPassed) {
  throw new Error('Test suite failures detected.');
}

