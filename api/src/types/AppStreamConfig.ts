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
  }
}
