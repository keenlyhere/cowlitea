'use client';
import { SignUp, useUser } from "@clerk/nextjs"; 
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createOrUpdateUserInFirestore } from "../utils/firebaseUtils";

export default function SignUpPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      createOrUpdateUserInFirestore(user);
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, user, router]);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
    </div>
  );
}
