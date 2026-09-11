import { notFound } from 'next/navigation';

// An unmatched URL renders the *root* not-found — no layout, no Theme, no
// locale. This catch-all pulls it into the group instead, at a 404 status.
function CatchAllPage(): never {
  notFound();
}

// Next parses this off the declaration, so it cannot be re-exported below.
export const dynamicParams = true;
export default CatchAllPage;
