import axios from 'axios'
import { useEffect, useState } from 'react'

export default function useTokens() {
  const getTokens = () => {
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')

    if (accessToken && refreshToken) {
      setAxiosRequestHeader(accessToken)
      return { accessToken, refreshToken }
    }
    return undefined
  }

  const [tokens, setTokens] = useState(getTokens())

  useEffect(() => {
    if (tokens === undefined) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }, [tokens])
  setAxiosResponse(setTokens)

  const saveTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    setAxiosRequestHeader(accessToken)
    setTokens({ accessToken, refreshToken })
  }

  return {
    setTokens: saveTokens,
    tokens
  }
}

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
        setTokens(undefined)
      }

      return Promise.reject(error)
    }
  )
}

// const refreshMyToken = async (refreshToken: string) => {
//   return fetch('http://localhost:5000/SASjsApi/auth/refresh', {
//     method: 'POST',
//     headers: {
//       Authorization: `Bearer ${refreshToken}`
//     }
//   }).then((data) => data.json())
// }
