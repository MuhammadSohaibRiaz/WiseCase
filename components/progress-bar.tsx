"use client"

import { useEffect, useState } from "react"

export function ProgressBar() {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Listen for navigation events
    const handleStart = () => {
      setIsVisible(true)
      setProgress(10)
    }

    const handleEnd = () => {
      setProgress(100)
      setTimeout(() => {
        setIsVisible(false)
        setProgress(0)
      }, 300)
    }

    // Track popstate for back/forward navigation
    window.addEventListener("popstate", handleStart)

    // Simulate progress increment during navigation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev
        return prev + Math.random() * 30
      })
    }, 200)

    return () => {
      clearInterval(interval)
      window.removeEventListener("popstate", handleStart)
    }
  }, [])

  // Complete progress bar on load
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setProgress(100)
        setTimeout(() => {
          setIsVisible(false)
          setProgress(0)
        }, 300)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div
      className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 z-50 transition-all duration-300"
      style={{ width: `${progress}%` }}
    />
  )
}
