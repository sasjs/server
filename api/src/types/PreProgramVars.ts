export interface PreProgramVars {
  username: string
  userId: string
  displayName: string
  /**
   * The origin the request arrived on. Reachable from anywhere that can reach
   * this server, which is what a program running on another host needs.
   */
  serverUrl: string
  /**
   * The plain listener's address, for a program this server executes itself: the
   * SAS session is a local child process, so loopback is enough and an https
   * callback would make it trust a certificate it may not have been issued.
   */
  localServerUrl: string
  httpHeaders: string[]
}
