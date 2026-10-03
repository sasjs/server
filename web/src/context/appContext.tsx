import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useState,
  useEffect,
  useCallback,
  ReactNode
} from 'react'
import axios from 'axios'

export enum ModeType {
  Server = 'server',
  Desktop = 'desktop'
}

export enum RunTimeType {
  SAS = 'sas',
  JS = 'js',
  PY = 'py',
  R = 'r'
}

interface AppContextProps {
  checkingSession: boolean
  loggedIn: boolean
  setLoggedIn?: Dispatch<SetStateAction<boolean>>
  needsToUpdatePassword: boolean
  setNeedsToUpdatePassword?: Dispatch<SetStateAction<boolean>>
  userId?: string
  setUserId?: Dispatch<SetStateAction<string | undefined>>
  username: string
  setUsername?: Dispatch<SetStateAction<string>>
  displayName: string
  setDisplayName?: Dispatch<SetStateAction<string>>
  isAdmin: boolean
  setIsAdmin?: Dispatch<SetStateAction<boolean>>
  mode: ModeType
  runTimes: RunTimeType[]
  /**
   * External auth providers configured on the server, and the display name of
   * the OIDC provider when there is one. Both come from the public
   * /SASjsApi/info response; oidcProviderName is undefined unless OIDC is
   * configured, and drives the single sign-on button on the login screen.
   */
  authProviders: string[]
  oidcProviderName?: string
  /**
   * Whether the server accepts password sign-in for local accounts. False
   * hides the password form: the server refuses those attempts outright, so
   * offering the form would only invite a refusal.
   */
  localLoginEnabled: boolean
  /**
   * The routes this caller may use, from
   * `GET /SASjsApi/info/myAuthorizedRoutes`. Empty until the answer arrives,
   * and empty for a caller the server grants nothing - which is what keeps the
   * Studio tab away from someone who cannot run code.
   */
  authorizedRoutes: string[]
  /**
   * Whether the list above has been answered for the current session. It is
   * false while the answer is in flight, which is not the same as "not
   * permitted" - a route that redirects on an empty list would bounce a deep
   * link to the home screen before the server had been asked.
   */
  authorizedRoutesLoaded: boolean
  /**
   * Whether the server admits a route for this caller. The list IS the gate's
   * answer, so the interface asks the same question the server answers rather
   * than re-deriving the rules and drifting from them.
   */
  isAuthorizedFor: (route: string) => boolean
  logout?: () => void
}

export const AppContext = createContext<AppContextProps>({
  checkingSession: false,
  loggedIn: false,
  needsToUpdatePassword: false,
  userId: '',
  username: '',
  displayName: '',
  isAdmin: false,
  mode: ModeType.Server,
  runTimes: [],
  authProviders: [],
  localLoginEnabled: true,
  authorizedRoutes: [],
  authorizedRoutesLoaded: false,
  isAuthorizedFor: () => false
})

/**
 * The session payload, as far as the SPA needs it, or null when the response
 * is not a session.
 *
 * Only a JSON object carrying a username is accepted. The route can be
 * answered by something other than the app: on Cloudron the platform's login
 * wall sits in front of every path except the health check, and an
 * unauthenticated poll of /SASjsApi/session is answered with a redirect to the
 * login page and a 200 text/html body. Axios resolves on that, so taking the
 * body on trust renders the authenticated shell - tabs, home page and all -
 * for a user who has no session, with an empty username and no way to sign in.
 */
export const readSession = (
  data: unknown
): {
  uid?: string
  username: string
  displayName: string
  isAdmin: boolean
  needsToUpdatePassword: boolean
} | null => {
  if (typeof data !== 'object' || data === null) return null

  const session = data as { [key: string]: unknown }

  if (typeof session.username !== 'string' || !session.username.trim())
    return null

  return {
    uid: typeof session.uid === 'string' ? session.uid : undefined,
    username: session.username,
    displayName:
      typeof session.displayName === 'string'
        ? session.displayName
        : session.username,
    isAdmin: session.isAdmin === true,
    needsToUpdatePassword: session.needsToUpdatePassword === true
  }
}

const AppContextProvider = (props: { children: ReactNode }) => {
  const { children } = props
  const [checkingSession, setCheckingSession] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [needsToUpdatePassword, setNeedsToUpdatePassword] = useState(false)
  const [userId, setUserId] = useState<string>()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [mode, setMode] = useState(ModeType.Server)
  const [runTimes, setRunTimes] = useState<RunTimeType[]>([])
  const [authProviders, setAuthProviders] = useState<string[]>([])
  const [oidcProviderName, setOidcProviderName] = useState<string>()
  // Defaults to true so a server that does not report the flag keeps the
  // password form rather than hiding the only way in.
  const [localLoginEnabled, setLocalLoginEnabled] = useState(true)
  const [authorizedRoutes, setAuthorizedRoutes] = useState<string[]>([])
  const [authorizedRoutesLoaded, setAuthorizedRoutesLoaded] = useState(false)

  const isAuthorizedFor = useCallback(
    (route: string) => authorizedRoutes.indexOf(route) > -1,
    [authorizedRoutes]
  )

  useEffect(() => {
    setCheckingSession(true)

    /**
     * The signed-out state, plus the CSRF cookie the login POST is checked
     * against. The cookie arrives as a `Set-Cookie` header on this GET and the
     * browser stores it, so nothing here has to read the page body.
     */
    const handleSignedOut = () => {
      setCheckingSession(false)
      setLoggedIn(false)
      setUserId(undefined)
      setUsername('')
      setDisplayName('')
      setIsAdmin(false)
      setNeedsToUpdatePassword(false)

      // Refreshes the XSRF-TOKEN cookie, which expires after a day; axios
      // echoes it as the X-XSRF-TOKEN header on the login POST.
      axios.get('/').catch(() => {})
    }

    axios
      .get('/SASjsApi/session')
      .then((res) => readSession(res.data))
      .then((session) => {
        // Anything that is not a session - a login page served by a proxy in
        // front of the app, an empty body - leaves the user signed out, so the
        // login screen (and with it the provider's sign-in button) is shown.
        if (!session) return handleSignedOut()

        setCheckingSession(false)
        setUserId(session.uid)
        setUsername(session.username)
        setDisplayName(session.displayName)
        setIsAdmin(session.isAdmin)
        setLoggedIn(true)
        setNeedsToUpdatePassword(session.needsToUpdatePassword)
      })
      .catch(handleSignedOut)

    axios
      .get('/SASjsApi/info')
      .then((res) => res.data)
      .then((data: any) => {
        setMode(data.mode)
        setRunTimes(data.runTimes)
        setAuthProviders(data.authProviders ?? [])
        setOidcProviderName(data.oidcProviderName)
        setLocalLoginEnabled(data.localLoginEnabled !== false)
      })
      .catch(() => {})
  }, [])

  /**
   * What the server will admit for this caller, refetched whenever the session
   * changes - a sign-in from the login screen sets loggedIn, and a logout
   * clears it.
   *
   * A failure, or a signed-out state, leaves the list empty. Empty hides the
   * permissioned entries, which is the safe direction: the alternative is
   * offering an entry that answers 401.
   */
  useEffect(() => {
    if (!loggedIn) {
      setAuthorizedRoutes([])
      setAuthorizedRoutesLoaded(false)
      return
    }

    setAuthorizedRoutesLoaded(false)

    axios
      .get('/SASjsApi/info/myAuthorizedRoutes')
      .then((res) => setAuthorizedRoutes(res.data?.paths ?? []))
      .catch(() => setAuthorizedRoutes([]))
      .finally(() => setAuthorizedRoutesLoaded(true))
  }, [loggedIn])

  const logout = useCallback(() => {
    axios.get('/SASLogon/logout').then(() => {
      setLoggedIn(false)
      setUsername('')
      setDisplayName('')
    })
  }, [])

  return (
    <AppContext.Provider
      value={{
        checkingSession,
        loggedIn,
        setLoggedIn,
        needsToUpdatePassword,
        setNeedsToUpdatePassword,
        userId,
        setUserId,
        username,
        setUsername,
        displayName,
        setDisplayName,
        isAdmin,
        setIsAdmin,
        mode,
        runTimes,
        authProviders,
        oidcProviderName,
        localLoginEnabled,
        authorizedRoutes,
        authorizedRoutesLoaded,
        isAuthorizedFor,
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export default AppContextProvider
