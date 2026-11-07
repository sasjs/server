/**
 * How a group's name is matched when the question is "is this the same label?".
 *
 * A group name is stored as it was given - it is a label a person reads, unlike
 * a username, which is folded because it is a login handle. But two names that
 * differ only in case are one label to that reader, so every path that decides
 * whether a group already exists matches case-insensitively:
 *
 * - `createGroup` refuses a duplicate;
 * - `GET /group/by/groupname/{name}` finds the group whatever case was typed;
 * - an OIDC group sync treats a provider group and a local group with the same
 *   folded name as a clash rather than creating a second one.
 *
 * The unique index on the model is byte-exact and stays that way, so the rule
 * lives here rather than in the database: a collation index would have to be
 * rebuilt on every existing deployment, and this is one rule in one place.
 */
export const groupNamePattern = (name: string): RegExp =>
  new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
