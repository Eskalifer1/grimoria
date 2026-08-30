import { PENDING_ACTION } from '@/constants/optimistic';
import { optimisticDescriptor } from '@/shared/lib/optimistic/descriptor';

import { userKey } from '../userOptimisticKeys';
import { updateName } from './index';

/**
 * The descriptor is declared over `{ id, name }` while the action takes `{ name }`
 * alone: the key needs a User to point at, and `updateName` deliberately has no id
 * parameter so that no caller can aim it at somebody else. The schema strips the
 * `id` back off before the write.
 */
const updateNameOptimistic = optimisticDescriptor<
  { id: string; name: string },
  { name: string; updatedAt: string }
>({
  run: updateName,
  pending: PENDING_ACTION.UPDATE,
  key: (input) => userKey(input.id),
  value: (data) => ({ name: data.name }),
  version: (data) => data.updatedAt,
});

export { updateNameOptimistic };
