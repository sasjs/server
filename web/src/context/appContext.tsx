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

interface AppContextProps {
  checkingSession: boolean
  loggedIn: boolean
  setLoggedIn: Dispatch<SetStateAction<boolean>> | null
  userName: string
  setUserName: Dispatch<SetStateAction<string>> | null
  displayName: string
  setDisplayName: Dispatch<SetStateAction<string>> | null
  logout: (() => void) | null
}

export const AppContext = createContext<AppContextProps>({
  checkingSession: false,
  loggedIn: false,
  setLoggedIn: null,
  userName: '',
  setUserName: null,
  displayName: '',
  setDisplayName: null,
  logout: null
})

const AppContextProvider = (props: { children: ReactNode }) => {
  const { children } = props
  const [checkingSession, setCheckingSession] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    setCheckingSession(true)

    axios
      .get('/SASjsApi/session')
      .then((response: any) => {
        setCheckingSession(false)
        setLoggedIn(true)
        setUserName(response.userName)
        setDisplayName(response.displayName)
      })
      .catch(() => {
        setLoggedIn(false)
      })
  }, [])

  const logout = useCallback(() => {
    axios.get('/logout').then(() => {
      setLoggedIn(false)
      setUserName('')
      setDisplayName('')
    })
  }, [])

  return (
    <AppContext.Provider
      value={{
        checkingSession,
        loggedIn,
        setLoggedIn,
        userName,
        setUserName,
        displayName,
        setDisplayName,
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export default AppContextProvider
