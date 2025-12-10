"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export function ProgressBar() {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Reset and start progress on route change
    setIsVisible(true)
    setProgress(10)

    // Simulate progress increment
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev
        return Math.min(prev + Math.random() * 15, 90)
      })
    }, 100)

    // Complete progress when route change is done
    const timer = setTimeout(() => {
      setProgress(100)
      setTimeout(() => {
        setIsVisible(false)
        setProgress(0)
      }, 200)
    }, 300)

    return () => {
      clearInterval(interval)
      clearTimeout(timer)
    }
  }, [pathname])

  if (!isVisible) return null

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-[9999] bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out shadow-lg"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
