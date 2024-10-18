'use client'
import { Box } from "@mui/material"
import { SignedIn } from "@clerk/nextjs"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Sidebar from "../components/Sidebar"
import ChatArea from "../components/ChatArea"

export default function Dashboard() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/landing')
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded) {
    return <div>Loading...</div>
  }
  return (
    <SignedIn>
      <Box display="flex" height="100vh" width="100vw">
        <Sidebar />
        <ChatArea />
      </Box>
    </SignedIn>
  )
}
