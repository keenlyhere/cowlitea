'use client';
import React, { createContext, useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useUser } from "@clerk/nextjs";
import {
  createConversation,
  updateConversation,
  deleteConversation,
  fetchConversationById,
  listenToUserConversations
} from "../utils/firebaseUtils";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      const unsubscribe = listenToUserConversations(user.id, (querySnapshot) => {
        const convos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        convos.sort((a, b) => b.updatedAt?.toMillis() - a.updatedAt?.toMillis());
        setConversations(convos);
        if (convos.length > 0 && !currentConversation) {
          setCurrentConversation(convos[0]);
          router.push(`/conversation/${convos[0].id}`);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  const startNewConversation = async () => {
    if (!user) return;

    const newConversationRef = await createConversation(user.id);
    const newConversation = {
      id: newConversationRef.id,
      userId: user.id,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCurrentConversation(newConversation);
    router.push(`/conversation/${newConversation.id}`);
  };

  const addMessage = async (message) => {
    if (!currentConversation) return;

    const updatedMessages = [...currentConversation.messages, message];
    await updateConversation(currentConversation.id, updatedMessages);

    setCurrentConversation((prev) => ({ ...prev, messages: updatedMessages }));
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        currentConversation,
        startNewConversation,
        setCurrentConversation,
        addMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
