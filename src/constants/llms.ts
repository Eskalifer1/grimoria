import { PUBLIC_ROUTES, type PublicRoute } from './routes';

/** One line of `/llms.txt`: a section's name, its route and what a reader finds there. */
interface LlmsSection {
  name: string;
  route: PublicRoute;
  description: string;
}

/**
 * The sections `/llms.txt` lists, one per `PUBLIC_ROUTES` key. The `Record` key
 * type is what makes a route added there and forgotten here a compile error.
 */
const LLMS_SECTIONS: Record<keyof typeof PUBLIC_ROUTES, LlmsSection> = {
  HOME: { name: 'Home', route: PUBLIC_ROUTES.HOME, description: 'The landing page and sign-in.' },
};

export type { LlmsSection };
export { LLMS_SECTIONS };
