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
  runTimes: []
})

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
