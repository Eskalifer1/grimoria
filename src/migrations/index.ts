import * as migration_20260826_111631_initial from './20260826_111631_initial';

export const migrations = [
  {
    up: migration_20260826_111631_initial.up,
    down: migration_20260826_111631_initial.down,
    name: '20260826_111631_initial'
  },
];
