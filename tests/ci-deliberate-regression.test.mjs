import test from "node:test";
import assert from "node:assert/strict";

// Temporary CI smoke check on an isolated branch. Never merge this test.
test("CI reports an intentional assertion failure", () => {
    assert.fail("Intentional regression: GitHub Actions must fail this run.");
});
