import { DEFAULT_MOCK_CONTROLS, type MockControls } from './mockControls';

/**
 * The panel's settings as the double sees them. One module-level value rather
 * than a cookie: the mock runs in the browser, so the panel and the actions it
 * drives are the same module instance, and a round trip would buy nothing.
 *
 * A test that wants a failure or a latency replaces this module with `vi.mock`.
 */
let controls: MockControls = DEFAULT_MOCK_CONTROLS;

function readMockControls(): Promise<MockControls> {
  return Promise.resolve(controls);
}

/** How a one-shot field clears: the plan for a call is written back after it. */
function writeMockControls(next: MockControls): Promise<void> {
  controls = next;

  return Promise.resolve();
}

export { readMockControls, writeMockControls };
