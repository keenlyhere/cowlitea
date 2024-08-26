

'use client'
import { Box } from "@mui/material";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";

export default function Layout() {
  return (
    <Box display="flex" height="100vh">
      <Sidebar />
      <ChatArea />
    </Box>
  );
}
