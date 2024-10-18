"use client"
import { Box, Button, Typography } from "@mui/material";
import { SignIn, useSignIn, useAuth, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createOrUpdateUserInFirestore } from "../utils/firebaseUtils"

export default function CustomSignInPage() {
  const router = useRouter()
  const { signIn, isLoaded } = useSignIn()
  const { isSignedIn } = useAuth()
  const { user, isLoaded: isUserLoaded } = useUser()
  const [loadingDemo, setLoadingDemo] = useState(false)

  const handleDemoSignIn = async () => {
    if (!isLoaded || loadingDemo) return;

    setLoadingDemo(true);

    try {
      const signInResult = await signIn.create({
        identifier: "demo@cowlitea.com",
        password: "password",
      });

      if (signInResult.status === "complete") {
        setTimeout(() => {
          router.replace("/dashboard");
        }, 500)
      } else {
        console.error("Sign-in did not complete.");
      }
    } catch (error) {
      console.error("Demo sign-in failed:", error);
      alert("Failed to sign in as demo user");
    } finally {
      setLoadingDemo(false);
    }
  };

  useEffect(() => {
    if (isSignedIn && isUserLoaded && user) {
      createOrUpdateUserInFirestore(user)
    }
  }, [isSignedIn, isUserLoaded, user])



  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100vh"
      width="100vw"
    >
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        textAlign="center"
      >
        <SignIn path="/sign-in" routing="path" afterSignInUrl="/dashboard" />

        <Box mt={2}>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleDemoSignIn}
            sx={{ marginTop: 2 }}
            disabled={loadingDemo}
          >
            {loadingDemo ? "Signing in..." : "Sign in as Demo User"}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
