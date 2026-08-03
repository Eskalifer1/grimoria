# Role enum baked into User from day one

`User.role: 'user' | 'moderator' | 'admin'` (default `'user'`) is part of the schema from the first migration, and every authorization check is written against `role` rather than a boolean like `isAdmin` — even though `moderator` has no distinct permissions yet. Retrofitting a role dimension after authorization code already assumes a boolean would mean rewriting every check site; the enum costs nothing extra to include now.

`Guest` is deliberately *not* a Role value — it's the absence of a session, handled by "no authenticated user" branches rather than a stored role.
