# No request queue, no retries, no offline writes

A write leaves the browser immediately or not at all. There is no persisted queue, no automatic
retry, no exponential backoff, and no support for composing writes while disconnected. Losing the
network means writes fail and say so.

This is the deliberate deviation from Expensify, whose architecture this system otherwise follows.
Their `SequentialQueue` exists because their product must work on a train: requests are persisted to
disk, replayed in order after a reload, deduplicated against each other, retried with backoff, and
arbitrated between tabs by a leader election. Every one of those mechanisms exists to serve offline
composition. Grimoria is a web app people use online. Without the offline requirement the queue
carries no weight of its own, and it is the single most expensive thing in their design.

Recording it as a decision rather than a gap, because the code looks the same either way: a reader
who finds optimistic updates, a persisted store and pending states, and no queue, will reasonably
conclude the queue is unfinished and start writing one.

## What follows from it

- **Ordering is resolved by ignoring, not by sequencing.** Two writes to one key race; each call
  carries a number and the store remembers the latest, per key and per field. A response the latest
  has entirely overtaken is dropped whole — no success data, no failure data. One overtaken in part
  settles the fields it still owns and writes none of the rest, or a two-field write overtaken on
  one field would either revert that field or strand the other in flight for good.
- **Failure is terminal until the User acts.** The optimistic value and its error stay on screen and
  in `localStorage`. Nothing retries behind their back.
- **`navigator.onLine` is signage, not a gate.** Being offline shows a banner; the write still goes
  out and still fails. Blocking it would mean promising to send it later, which is the thing we are
  not building.
- **Nothing is idempotent by construction.** Expensify's queue can replay a request, so their server
  answers `ALREADY_CREATED` as a success. Ours never replays, so no write needs that contract.
