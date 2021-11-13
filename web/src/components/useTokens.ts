import axios from 'axios'
import { useEffect, useState } from 'react'

export default function useTokens() {
  const getTokens = () => {
    const accessTokenString = localStorage.getItem('accessToken')
    const accessToken: string = accessTokenString
      ? JSON.parse(accessTokenString)
      : undefined

    const refreshTokenString = localStorage.getItem('refreshToken')
    const refreshToken: string = refreshTokenString
      ? JSON.parse(refreshTokenString)
      : undefined

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
    localStorage.setItem('accessToken', JSON.stringify(accessToken))
    localStorage.setItem('refreshToken', JSON.stringify(refreshToken))
    setAxiosRequestHeader(accessToken)
    setTokens({ accessToken, refreshToken })
  }

  return {
    setTokens: saveTokens,
    tokens
  }
}

const baseUrl =
  process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : undefined

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