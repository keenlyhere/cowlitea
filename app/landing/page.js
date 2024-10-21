'use client'
import { Box, Button, Typography } from "@mui/material"
import { useRouter } from "next/navigation"
import { SignedOut, useSignIn, useUser } from "@clerk/nextjs"
import { useEffect } from "react"


export default function LandingPage() {
  const router = useRouter()
  const { signIn, isLoaded } = useSignIn()
  const { isSignedIn, user, isLoaded: isUserLoaded } = useUser()

useEffect(() => {
  if (isLoaded && isSignedIn) {
    router.replace('/dashboard')
  }
}, [isLoaded, isSignedIn, router])

if (!isLoaded) {
  return <div>Loading...</div>
}

  const handleSignIn = () => {
    router.push("/sign-in")
  }

  const handleSignUp = () => {
    router.push("/sign-up")
  }


  return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh" width="100vw">
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          textAlign="center"
        >
          <Typography variant="h3" gutterBottom>
            Welcome to Cowlitea
          </Typography>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            The boba shop recommendation assistant
          </Typography>
          <Box mt={2} display="flex" flexDirection="column" gap={2}>
            <Button variant="contained" color="primary" onClick={handleSignIn}>
              Sign In
            </Button>
            <Button variant="outlined" color="secondary" onClick={handleSignUp}>
              Sign Up
            </Button>

          </Box>
        </Box>
      </Box>
  )
}
