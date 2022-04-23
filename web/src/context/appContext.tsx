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

const NODE_ENV = process.env.NODE_ENV
const PORT_API = process.env.PORT_API
const baseUrl =
  NODE_ENV === 'development' ? `http://localhost:${PORT_API ?? 5000}` : ''

const isAbsoluteURLRegex = /^(?:\w+:)\/\//

const setAxiosRequestHeader = (accessToken: string) => {
  axios.interceptors.request.use(function (config) {
    if (baseUrl && !isAbsoluteURLRegex.test(config.url as string)) {
      config.url = baseUrl + config.url
    }
    console.log('axios.interceptors.request.use', accessToken)
    config.headers!['Authorization'] = `Bearer ${accessToken}`
    config.withCredentials = true

    return config
  })
}

const setAxiosResponse = (setTokens: Function) => {
  // Add a response interceptor
  axios.interceptors.response.use(
    function (response) {
      // Any status code that lie within the range of 2xx cause this function to trigger
      return response
    },
    async function (error) {
      if (error.response?.status === 401) {
        // refresh token
        // const { accessToken, refreshToken: newRefresh } = await refreshMyToken(
        //   refreshToken
        // )

        // if (accessToken && newRefresh) {
        //   setTokens(accessToken, newRefresh)
        //   error.config.headers['Authorization'] = 'Bearer ' + accessToken
        //   error.config.baseURL = undefined

        //   return axios.request(error.config)
        // }
        console.log(53)
        setTokens(undefined)
      }

      return Promise.reject(error)
    }
  )
}

const getTokens = () => {
  const accessToken = localStorage.getItem('accessToken')
  const refreshToken = localStorage.getItem('refreshToken')

  if (accessToken && refreshToken) {
    setAxiosRequestHeader(accessToken)
    return { accessToken, refreshToken }
  }
  return undefined
}

interface AppContextProps {
  userName: string
  setUserName: Dispatch<SetStateAction<string>> | null
  tokens?: { accessToken: string; refreshToken: string }
  setTokens: ((accessToken: string, refreshToken: string) => void) | null
  logout: (() => void) | null
}

export const AppContext = createContext<AppContextProps>({
  userName: '',
  tokens: getTokens(),
  setUserName: null,
  setTokens: null,
  logout: null
})

const AppContextProvider = (props: { children: ReactNode }) => {
  const { children } = props
  const [userName, setUserName] = useState('')
  const [tokens, setTokens] = useState(getTokens())

  useEffect(() => {
    setAxiosResponse(setTokens)
  }, [])

  useEffect(() => {
    console.log(97)
    if (tokens === undefined) {
      console.log(99)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }, [tokens])

  const saveTokens = useCallback(
    (accessToken: string, refreshToken: string) => {
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      console.log(accessToken)
      setAxiosRequestHeader(accessToken)
      setTokens({ accessToken, refreshToken })
    },
    []
  )

  const logout = useCallback(() => {
    setUserName('')
    setTokens(undefined)
  }, [])

  return (
    <AppContext.Provider
      value={{
        userName,
        setUserName,
        tokens,
        setTokens: saveTokens,
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export default AppContextProvider