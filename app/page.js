'use client'
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"

export default function HomePage() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return

    if (isSignedIn) {
      router.replace("/dashboard")
    } else {
      router.replace("/landing")
    }
  }, [isSignedIn, isLoaded, router])

  return <div>Loading...</div>
}
