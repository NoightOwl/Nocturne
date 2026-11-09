// Import all suites so the project can be tested in one process without
// relying on shell glob expansion or child-process spawning.
import "./entropy.test.mjs";
import "./canonical.test.mjs";
import "./hash.test.mjs";
import "./format.test.mjs";
import "./router.test.mjs";
import "./budget.test.mjs";
