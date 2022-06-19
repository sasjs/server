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
  JS = 'js'
}

interface AppContextProps {
  checkingSession: boolean
  loggedIn: boolean
  setLoggedIn: Dispatch<SetStateAction<boolean>> | null
  userId: number
  setUserId: Dispatch<SetStateAction<number>> | null
  username: string
  setUsername: Dispatch<SetStateAction<string>> | null
  displayName: string
  setDisplayName: Dispatch<SetStateAction<string>> | null
  mode: ModeType
  runTimes: RunTimeType[]
  logout: (() => void) | null
}

export const AppContext = createContext<AppContextProps>({
  checkingSession: false,
  loggedIn: false,
  setLoggedIn: null,
  userId: 0,
  setUserId: null,
  username: '',
  setUsername: null,
  displayName: '',
  setDisplayName: null,
  mode: ModeType.Server,
  runTimes: [],
  logout: null
})

const AppContextProvider = (props: { children: ReactNode }) => {
  const { children } = props
  const [checkingSession, setCheckingSession] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [userId, setUserId] = useState(0)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
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
        setLoggedIn(true)
      })
      .catch(() => {
        setLoggedIn(false)
        axios.get('/') // get CSRF TOKEN
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
    axios.get('/logout').then(() => {
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
        userId,
        setUserId,
        username,
        setUsername,
        displayName,
        setDisplayName,
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
