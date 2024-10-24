import { Inter } from "next/font/google"
import "./globals.css"
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter"
import { ThemeProvider } from "@mui/material/styles"
import {
  ClerkProvider,
  RedirectToSignIn,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import { ChatProvider } from "./context/ChatContext"
import theme from "../theme"

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};


export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <AppRouterCacheProvider>
            <ThemeProvider theme={theme}>
              <ChatProvider>
                <SignedIn>{children}</SignedIn>
                <SignedOut> {children}</SignedOut>
              </ChatProvider>
            </ThemeProvider>
          </AppRouterCacheProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
