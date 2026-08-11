# Grimoria

A personal knowledge base for saving and rediscovering things you've learned (articles, videos, approaches, libraries) as structured, searchable notes — with an optional full dark-fantasy re-skin where the same product is framed as a wizard's grimoire of spells.

## Language

**User**:
A person with an account. Every User has a **Role** (see below) determining what they're permitted to do.
_Avoid_: Account.

**Guest**:
A visitor without a session. Not a stored entity or Role — purely the absence of authentication. Anywhere "guest access" is discussed, it means "what an unauthenticated request is allowed to see."
_Avoid_: Anonymous user, Visitor (as a stored concept).

**Role**:
A set of values on User determining permission level: `user` (default), `moderator`, `admin`. Authorization checks are written against this field, through a permission helper rather than an equality test — `role` holds an array (ADR-0003).
_Avoid_: isAdmin flag, permission level (as a separate concept from Role).

**Theme**:
A user's chosen visual and copy mode: `standard` or `dark-fantasy`. Persisted on the User profile, in a cookie for Guests; orthogonal to locale (ADR-0004). The flavor mapping — what each term becomes — is `docs/features/dark-fantasy-theme.md`.
_Avoid_: Skin (as the stored value's name — "Theme" is the field, dark-fantasy re-skinning is the feature built on top of it).

**Note**:
The core object a User records — a write-up of something they learned (an approach, a library, a video, an article) with an example and a source link. Content is Markdown.
_Avoid_: Article, Entry (reserve those for prose about notes, not the object itself).

**Visibility**:
Whether a Note can be seen by others: `private` (default — only the owner) or `public` (anyone, including Guests, via the public notes page). A third state (draft) is a deferred, non-core addition — v1 only has these two.
_Avoid_: Published/unpublished (implies the future draft state already exists).
