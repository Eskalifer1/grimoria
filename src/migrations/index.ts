import * as migration_20260821_132909_initial from './20260821_132909_initial';

export const migrations = [
  {
    up: migration_20260821_132909_initial.up,
    down: migration_20260821_132909_initial.down,
    name: '20260821_132909_initial'
  },
];
