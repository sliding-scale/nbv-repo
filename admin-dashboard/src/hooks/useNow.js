import { useEffect, useState } from 'react'

/** Current time that re-renders every `intervalMs`, for live durations like "running for 12 min". */
export default function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
