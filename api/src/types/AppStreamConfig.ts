export interface AppStreamConfig {
  [key: string]: {
    appLoc: string
    streamWebFolder: string
    streamLogo?: string
    /**
     * When this entry was last published, as an ISO timestamp.
     *
     * Optional because a registry written before this field existed has no
     * value for it, and a publish that predates it is not a date we can invent.
     * Publishing again moves it, so it is both the created and the last
     * modified time of the bundle: the entry IS the publish.
     */
    publishedAt?: string
    /**
     * Origins allowed to frame this app, as CSP `frame-ancestors` sources.
     *
     * Absent means the server's own policy stands, which is `'self'` - every app
     * that never asked to be framed stays framed by nobody. An app embedded by a
     * page on another domain names that origin here, so the exception is a
     * reviewed per-app decision rather than a relaxation of the whole server.
     *
     * A cross-domain exception also needs the session cookie to travel into the
     * framed page (`SameSite=None; Secure`), or the app frames and then cannot
     * authenticate.
     */
    frameAncestors?: string | string[]
  }
}
