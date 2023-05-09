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
  setLoggedIn: Dispatch<SetStateAction<boolean>> | null
  needsToUpdatePassword: boolean
  setNeedsToUpdatePassword: Dispatch<SetStateAction<boolean>> | null
  userId: string
  setUserId: Dispatch<SetStateAction<string>> | null
  username: string
  setUsername: Dispatch<SetStateAction<string>> | null
  displayName: string
  setDisplayName: Dispatch<SetStateAction<string>> | null
  isAdmin: boolean
  setIsAdmin: Dispatch<SetStateAction<boolean>> | null
  mode: ModeType
  runTimes: RunTimeType[]
  logout: (() => void) | null
}

export const AppContext = createContext<AppContextProps>({
  checkingSession: false,
  loggedIn: false,
  setLoggedIn: null,
  needsToUpdatePassword: false,
  setNeedsToUpdatePassword: null,
  userId: '',
  setUserId: null,
  username: '',
  setUsername: null,
  displayName: '',
  setDisplayName: null,
  isAdmin: false,
  setIsAdmin: null,
  mode: ModeType.Server,
  runTimes: [],
  logout: null
})

const AppContextProvider = (props: { children: ReactNode }) => {
  const { children } = props
  const [checkingSession, setCheckingSession] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [needsToUpdatePassword, setNeedsToUpdatePassword] = useState(false)
  const [userId, setUserId] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [mode, setMode] = useState(ModeType.Server)
  const [runTimes, setRunTimes] = useState<RunTimeType[]>([])

  useEffect(() => {
    setCheckingSession(true)

    axios
      .get('/SASjsApi/session')
      .then((res) => res.data)
      .then((data: any) => {
        setCheckingSession(false)
        setUserId(data.id)
        setUsername(data.username)
        setDisplayName(data.displayName)
        setIsAdmin(data.isAdmin)
        setLoggedIn(true)
        setNeedsToUpdatePassword(data.needsToUpdatePassword)
      })
      .catch(() => {
        setLoggedIn(false)
        // get CSRF TOKEN and set cookie
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
      })

    axios
      .get('/SASjsApi/info')
      .then((res) => res.data)
      .then((data: any) => {
        setMode(data.mode)
        setRunTimes(data.runTimes)
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
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export default AppContextProvider
