# Single frontend app with gated admin routes, not a separate admin app

Admin currently needs no distinct design system or scaling profile from the client app — it's a thin read/edit layer over the same data. Splitting it into its own app now would mean two deploy targets, two envs, and a shared auth package, for a solo project where that isolation isn't yet justified. We're keeping admin as `/admin/*` routes gated by Role inside the single client app, with the theme provider (see dark-fantasy skin) scoped to the non-admin route group so admin never renders themed copy or styles.

Extracting admin into its own app later (e.g. if IP-level lockdown or independent scaling is ever needed) is a mechanical refactor, not a data-model change — this decision is cheap to reverse.
