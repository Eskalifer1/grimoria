/**
 * The string `Form.Select` and `Form.RadioGroup` hand their control: the field
 * reads `undefined` until a value is seeded, and no path's value type is visible
 * here, so a field holding a number ends up holding the option's string instead.
 */
function optionValue(value: unknown): string {
  return String(value ?? '');
}

export { optionValue };
