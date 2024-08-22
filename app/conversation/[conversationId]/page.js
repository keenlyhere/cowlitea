"use client";
import { useEffect, useContext } from "react";
import { Box } from "@mui/material";
import { useRouter } from "next/navigation";
import { ChatContext } from "../../context/ChatContext";
import Sidebar from "../../components/Sidebar";
import ChatArea from "../../components/ChatArea";

export default function ConversationPage({ params }) {
  const { conversationId } = params;
  const { conversations, setCurrentConversation, currentConversation } = useContext(ChatContext);
  const router = useRouter();

  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find((conv) => conv.id === conversationId);
      if (conversation) {
        setCurrentConversation(conversation);
      } else {
        router.push("/");
      }
    }
  }, [conversationId, conversations, setCurrentConversation, router]);

  if (!currentConversation) {
    return <div>Loading...</div>;
  }

  return (
    <Box display="flex" height="100vh">
      <Sidebar />
      <ChatArea />
    </Box>
  );
}
