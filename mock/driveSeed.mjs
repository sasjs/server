/**
 * The drive files a server creates for itself, that a captured snapshot does not
 * carry.
 *
 * `mock/drive.json` is a capture of a drive someone filled, so it holds the files
 * that were put there by hand. A server also writes a few of its own at startup,
 * and the one a visitor notices is the drive root's `.sasjslint`: the rules file
 * every SAS file with no nearer one is linted against, which the Studio tree shows
 * at the root of a real installation (api/src/app.ts seeds it on boot).
 *
 * The content is read from the API's own JSON rather than restated here, so the
 * demonstration site and a server cannot seed different rules.
 */
export const DRIVE_ROOT = '/sasjs/drive/files'

/** The drive with the server-seeded files on it, as a new snapshot. */
export const withServerSeededFiles = (snapshot, lintConfiguration) => ({
  ...snapshot,
  files: {
    ...(snapshot.files ?? {}),
    [`${DRIVE_ROOT}/.sasjslint`]: lintConfiguration
  }
})
