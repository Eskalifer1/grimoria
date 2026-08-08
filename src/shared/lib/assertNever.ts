/**
 * Exhaustiveness check for discriminated unions. Call it in the `default` branch of a
 * `switch`: while every variant is handled the argument is `never` and this typechecks,
 * so adding a variant fails `tsc` in every switch that ignores it. The throw covers the
 * runtime case where the data carried a variant the types never knew about.
 *
 * See docs/agents/coding-standards/typescript.md §4.
 */
function assertNever(value: never): never {
  throw new Error(`Unhandled variant: ${JSON.stringify(value)}`);
}

export { assertNever };
