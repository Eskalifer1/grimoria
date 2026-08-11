# Role baked into User from day one

`User.role` is part of the schema from the first migration, and every authorization check reads it rather than a boolean like `isAdmin` — even though `moderator` has no distinct permissions yet. Retrofitting a role dimension after authorization code already assumes a boolean means rewriting every check site; carrying `moderator` from the start costs nothing.

**`role` holds a set of values, not one** — a `hasMany` select over `user`, `moderator` and `admin`, defaulting to `user`. Better Auth's admin plugin models roles that way and generates the field (ADR-0009). Checks therefore go through a permission helper that takes the User and the thing being asked; `user.role === 'admin'` compares a string to an array and is silently false.

`Guest` is deliberately *not* a Role value — it's the absence of a session, handled by "no authenticated user" branches rather than a stored role.
