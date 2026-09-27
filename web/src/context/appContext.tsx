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
  authProviders: []
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

  useEffect(() => {
    setCheckingSession(true)

    /**
     * The signed-out state, plus the CSRF cookie the login POST needs. The
     * token is injected into the app's own index.html rather than sent as a
     * header, so a failed session poll has to fetch the page to obtain it.
     */
    const handleSignedOut = () => {
      setCheckingSession(false)
      setLoggedIn(false)
      setUserId(undefined)
      setUsername('')
      setDisplayName('')
      setIsAdmin(false)
      setNeedsToUpdatePassword(false)

      axios
        .get('/')
        .then((res) => res.data)
        .then((data: string) => {
          const result =
            /<script>document.cookie = '(XSRF-TOKEN=.*; Max-Age=86400; SameSite=Strict; Path=\/;)'<\/script>/.exec(
              data
            )?.[1]

          if (result) document.cookie = result
        })
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
      })
      .catch(() => {})
  }, [])

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
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export default AppContextProvider
