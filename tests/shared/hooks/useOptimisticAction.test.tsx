import { useState } from 'react';

import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  ACTION_ERROR,
  ACTION_STATUS,
  FAILURE_BEHAVIOR,
  type FailureBehavior,
} from '@/constants/action';
import { useOptimisticAction } from '@/shared/hooks/useOptimisticAction';
import { type ActionResult, actionFailure, actionSuccess } from '@/shared/lib/actionResult';

interface ProbeProps {
  value: string;
  failureBehavior: FailureBehavior;
  action: () => Promise<ActionResult<{ name: string }>>;
  successValue?: (data: { name: string }) => string;
}

/** The smallest surface the hook can drive: one value, one button, the state read back as text. */
function Probe({ value, failureBehavior, action, successValue }: ProbeProps) {
  const state = useOptimisticAction<string>({ value, failureBehavior });
  const [resolved, setResolved] = useState('none');

  return (
    <div>
      <p>{state.value}</p>
      <p>{`status:${state.status}`}</p>
      <p>{`code:${state.error?.code ?? 'none'}`}</p>
      <p>{`resolved:${resolved}`}</p>
      <button
        type="button"
        onClick={() => {
          void state.run('typed', action, { successValue }).then((result) => {
            setResolved(result.error?.code ?? ACTION_STATUS.SUCCESS);
          });
        }}
      >
        run
      </button>
      <button type="button" onClick={state.reset}>
        reset
      </button>
    </div>
  );
}

function clickRun() {
  fireEvent.click(screen.getByRole('button', { name: 'run' }));
}

function clickButton(name: string) {
  fireEvent.click(screen.getByRole('button', { name }));
}

/** A promise the test settles by hand, so two calls can be made to finish out of order. */
function deferred<TValue>() {
  let resolve: ((value: TValue) => void) | undefined;
  const promise = new Promise<TValue>((settle) => {
    resolve = settle;
  });

  return { promise, settle: (value: TValue) => resolve?.(value) };
}

interface RaceProbeProps {
  value?: string;
  first: () => Promise<ActionResult<{ name: string }>>;
  second: () => Promise<ActionResult<{ name: string }>>;
}

/** Two writes over one value, each with an action the test finishes when it chooses. */
function RaceProbe({ value = 'confirmed', first, second }: RaceProbeProps) {
  const state = useOptimisticAction<string>({
    value,
    failureBehavior: FAILURE_BEHAVIOR.ROLLBACK,
  });

  return (
    <div>
      <p>{state.value}</p>
      <p>{`status:${state.status}`}</p>
      <button type="button" onClick={() => void state.run('first', first)}>
        run first
      </button>
      <button type="button" onClick={() => void state.run('second', second)}>
        run second
      </button>
      <button type="button" onClick={state.reset}>
        reset
      </button>
    </div>
  );
}

interface ItemProbeProps {
  label: string;
  version: number;
  action: () => Promise<ActionResult<{ name: string }>>;
}

/** A `TValue` the render rebuilds every time, which is what `isSameValue` exists for. */
function ItemProbe({ label, version, action }: ItemProbeProps) {
  const state = useOptimisticAction<{ label: string; version: number }>({
    value: { label, version },
    failureBehavior: FAILURE_BEHAVIOR.KEEP,
    // What the doc requires: something that moves when the server value moves.
    isSameValue: (previous, next) => previous.version === next.version,
  });

  return (
    <div>
      <p>{`label:${state.value.label}`}</p>
      <p>{`status:${state.status}`}</p>
      <button type="button" onClick={() => void state.run({ label: 'typed', version }, action)}>
        run
      </button>
    </div>
  );
}

describe('useOptimisticAction', () => {
  // ROLLBACK versus KEEP is settled on the pure `settleOptimistic`
  // (tests/shared/lib/optimisticState.test.ts); what is tested here is the wiring
  // React adds around it.
  it('keeps the optimistic value on failure under KEEP', async () => {
    const action = vi.fn(async () => actionFailure(ACTION_ERROR.CONFLICT));

    render(<Probe value="confirmed" failureBehavior={FAILURE_BEHAVIOR.KEEP} action={action} />);
    clickRun();

    expect(await screen.findByText(`status:${ACTION_STATUS.FAILURE}`)).toBeInTheDocument();
    expect(screen.getByText('typed')).toBeInTheDocument();
  });

  it('settles with UNEXPECTED when the request itself breaks', async () => {
    const action = vi.fn(async () => {
      throw new Error('network down');
    });

    render(<Probe value="confirmed" failureBehavior={FAILURE_BEHAVIOR.ROLLBACK} action={action} />);
    clickRun();

    expect(await screen.findByText(`code:${ACTION_ERROR.UNEXPECTED}`)).toBeInTheDocument();
    expect(screen.getByText('confirmed')).toBeInTheDocument();
  });

  it('lets a fresher value supersede the optimistic one without dropping the failure', async () => {
    const action = vi.fn(async () => actionFailure(ACTION_ERROR.CONFLICT));
    const { rerender } = render(
      <Probe value="confirmed" failureBehavior={FAILURE_BEHAVIOR.ROLLBACK} action={action} />,
    );

    clickRun();
    await screen.findByText(`status:${ACTION_STATUS.FAILURE}`);

    // What a revalidation, or an edit made elsewhere, arrives as.
    rerender(
      <Probe value="moved on" failureBehavior={FAILURE_BEHAVIOR.ROLLBACK} action={action} />,
    );

    // The prop is the better answer, so it takes the screen — but the write still
    // failed, and the User has not been told yet.
    expect(screen.getByText('moved on')).toBeInTheDocument();
    expect(screen.getByText(`status:${ACTION_STATUS.FAILURE}`)).toBeInTheDocument();
    expect(screen.getByText(`code:${ACTION_ERROR.CONFLICT}`)).toBeInTheDocument();
  });

  it('reports a failure that lands after the value moved on', async () => {
    const slow = deferred<ActionResult<{ name: string }>>();
    const unused = deferred<ActionResult<{ name: string }>>();
    const { rerender } = render(
      <RaceProbe value="confirmed" first={() => slow.promise} second={() => unused.promise} />,
    );

    clickButton('run first');

    // A revalidation from an earlier write lands while this one is still in flight.
    rerender(
      <RaceProbe value="moved on" first={() => slow.promise} second={() => unused.promise} />,
    );

    await act(async () => {
      slow.settle(actionFailure(ACTION_ERROR.CONFLICT));
    });

    expect(screen.getByText(`status:${ACTION_STATUS.FAILURE}`)).toBeInTheDocument();
  });

  it('clears a settled failure on reset', async () => {
    const action = vi.fn(async () => actionFailure(ACTION_ERROR.CONFLICT));

    render(<Probe value="confirmed" failureBehavior={FAILURE_BEHAVIOR.ROLLBACK} action={action} />);
    clickRun();
    await screen.findByText(`code:${ACTION_ERROR.CONFLICT}`);

    fireEvent.click(screen.getByRole('button', { name: 'reset' }));

    expect(screen.getByText('code:none')).toBeInTheDocument();
    expect(screen.getByText(`status:${ACTION_STATUS.IDLE}`)).toBeInTheDocument();
  });

  it('resolves run with the action’s own result', async () => {
    const action = vi.fn(async () => actionFailure(ACTION_ERROR.CONFLICT));

    render(<Probe value="confirmed" failureBehavior={FAILURE_BEHAVIOR.KEEP} action={action} />);
    clickRun();

    expect(await screen.findByText(`resolved:${ACTION_ERROR.CONFLICT}`)).toBeInTheDocument();
  });

  it('answers with the write’s own result when the successValue mapper throws', async () => {
    const action = vi.fn(async () => actionSuccess({ name: 'stored' }));

    render(
      <Probe
        value="confirmed"
        failureBehavior={FAILURE_BEHAVIOR.ROLLBACK}
        action={action}
        successValue={() => {
          throw new Error('the mapper is broken');
        }}
      />,
    );

    clickRun();

    // The row is written. A defect in our own mapper must not come back as a
    // failed write, which would tell the User to retry what already landed.
    expect(await screen.findByText(`resolved:${ACTION_STATUS.SUCCESS}`)).toBeInTheDocument();
  });

  it('ignores a superseded call that answers after a later one', async () => {
    const slow = deferred<ActionResult<{ name: string }>>();
    const fast = deferred<ActionResult<{ name: string }>>();

    render(<RaceProbe first={() => slow.promise} second={() => fast.promise} />);

    clickButton('run first');
    clickButton('run second');

    // The later call answers first, then the superseded one answers late. It must
    // not put its own outcome back on a screen a later call already owns.
    await act(async () => {
      fast.settle(actionSuccess({ name: 'second' }));
    });

    await act(async () => {
      slow.settle(actionFailure(ACTION_ERROR.CONFLICT));
    });

    expect(screen.getByText('second')).toBeInTheDocument();
    expect(screen.getByText(`status:${ACTION_STATUS.SUCCESS}`)).toBeInTheDocument();
  });

  it('ignores a response that lands after a reset', async () => {
    const slow = deferred<ActionResult<{ name: string }>>();
    const unused = deferred<ActionResult<{ name: string }>>();

    render(<RaceProbe first={() => slow.promise} second={() => unused.promise} />);

    clickButton('run first');
    clickButton('reset');

    await act(async () => {
      slow.settle(actionFailure(ACTION_ERROR.CONFLICT));
    });

    expect(screen.getByText(`status:${ACTION_STATUS.IDLE}`)).toBeInTheDocument();
    expect(screen.getByText('confirmed')).toBeInTheDocument();
  });

  it('keeps what a KEEP failure left on screen across a value rebuilt at the same version', async () => {
    const action = vi.fn(async () => actionFailure(ACTION_ERROR.CONFLICT));
    const { rerender } = render(<ItemProbe label="confirmed" version={1} action={action} />);

    clickRun();
    await screen.findByText(`status:${ACTION_STATUS.FAILURE}`);
    expect(screen.getByText('label:typed')).toBeInTheDocument();

    // The same truth, rebuilt: identity changed, the version did not.
    rerender(<ItemProbe label="confirmed" version={1} action={action} />);

    expect(screen.getByText(`status:${ACTION_STATUS.FAILURE}`)).toBeInTheDocument();
    expect(screen.getByText('label:typed')).toBeInTheDocument();
  });

  it('shows a value the server moved to at a new version', async () => {
    const action = vi.fn(async () => actionFailure(ACTION_ERROR.CONFLICT));
    const { rerender } = render(<ItemProbe label="confirmed" version={1} action={action} />);

    clickRun();
    await screen.findByText('label:typed');

    // A version the write did not produce: the server moved on, and its value wins.
    rerender(<ItemProbe label="renamed elsewhere" version={2} action={action} />);

    expect(screen.getByText('label:renamed elsewhere')).toBeInTheDocument();
  });
});
