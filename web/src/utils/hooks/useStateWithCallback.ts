import { useState, useEffect, useRef } from 'react'

export const useStateWithCallback = <T>(
  initialValue: T
): [T, (newValue: T, callback?: () => void) => void] => {
  const callbackRef = useRef<any>(null)

  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    if (typeof callbackRef.current === 'function') {
      callbackRef.current()

      callbackRef.current = null
    }
  }, [value])

  const setValueWithCallback = (newValue: T, callback?: () => void) => {
    callbackRef.current = callback

    setValue(newValue)
  }

  return [value, setValueWithCallback]
}

export default useStateWithCallback
