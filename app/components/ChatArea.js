import ReactMarkdown from "react-markdown";
import { Box, Button, Stack, TextField } from "@mui/material";
import { useState, useContext } from "react";
import { ChatContext } from "../context/ChatContext";
import { addDoc, collection, updateDoc, doc } from "firebase/firestore";
import { db } from "@/firebase";
import { useUser } from "@clerk/nextjs";

export default function ChatArea() {
  const { currentConversation, setCurrentConversation, addMessage } =
    useContext(ChatContext);
  const { user } = useUser();
  const [messages, setMessages] = useState(
    currentConversation ? currentConversation.messages : []
  );
  const [message, setMessage] = useState("");

  const sendMessage = async () => {
    if (!message.trim() || !currentConversation) return;

    const userMessage = {
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    const newMessages = [
      ...messages,
      userMessage,
      { role: "assistant", content: "", timestamp: new Date() },
    ];
    setMessages(newMessages);
    setMessage("");

    await updateDoc(doc(db, "conversations", currentConversation.id), {
      messages: newMessages,
      updatedAt: new Date(),
    });

    fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify([...messages, userMessage]),
    }).then(async (res) => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      reader.read().then(function processText({ done, value }) {
        if (done) return;

        const text = decoder.decode(value || new Uint8Array(), {
          stream: true,
        });
        fullResponse += text;

        setMessages((prevMessages) => {
          const lastMessageIndex = prevMessages.length - 1;
          const updatedMessages = [...prevMessages];
          updatedMessages[lastMessageIndex] = {
            ...prevMessages[lastMessageIndex],
            content: fullResponse.trim(),
          };
          return updatedMessages;
        });

        return reader.read().then(processText);
      });

      // Update Firebase with the complete assistant's response
      await updateDoc(doc(db, "conversations", currentConversation.id), {
        messages: [
          ...newMessages.slice(0, -1), // Everything except the last assistant's empty message
          {
            role: "assistant",
            content: fullResponse.trim(),
            timestamp: new Date(),
          },
        ],
        updatedAt: new Date(),
      });
    });
  };

  if (!currentConversation) {
    return (
      <Box
        flexGrow={1}
        p={2}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
      >
        <p>You do not have any conversations</p>
      </Box>
    );
  }

  return (
    <Box
      flexGrow={1}
      p={2}
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      <Stack direction="column" spacing={2} flexGrow={1} overflow="auto">
        {messages.map((message, index) => (
          <Box
            key={index}
            display="flex"
            justifyContent={
              message.role === "assistant" ? "flex-start" : "flex-end"
            }
          >
            <Box
              bgcolor={
                message.role === "assistant" ? "primary.main" : "secondary.main"
              }
              color="white"
              borderRadius={16}
              p={2}
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </Box>
          </Box>
        ))}
      </Stack>
      <Stack direction="row" spacing={2} mt={2}>
        <TextField
          label="Message"
          fullWidth
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button variant="contained" onClick={sendMessage}>
          Send
        </Button>
      </Stack>
    </Box>
  );
}
