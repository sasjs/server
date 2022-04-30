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
  username: string
  setUsername: Dispatch<SetStateAction<string>> | null
  displayName: string
  setDisplayName: Dispatch<SetStateAction<string>> | null
  logout: (() => void) | null
}

export const AppContext = createContext<AppContextProps>({
  checkingSession: false,
  loggedIn: false,
  setLoggedIn: null,
  username: '',
  setUsername: null,
  displayName: '',
  setDisplayName: null,
  logout: null
})

const AppContextProvider = (props: { children: ReactNode }) => {
  const { children } = props
  const [checkingSession, setCheckingSession] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    setCheckingSession(true)

    axios
      .get('/SASjsApi/session')
      .then((res) => res.data)
      .then((data: any) => {
        setCheckingSession(false)
        setLoggedIn(true)
        setUsername(data.username)
        setDisplayName(data.displayName)
      })
      .catch(() => {
        setLoggedIn(false)
        axios.get('/') // get CSRF TOKEN
      })
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
        username,
        setUsername,
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
