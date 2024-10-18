'use client';
import React, { createContext, useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useUser } from "@clerk/nextjs";
import {
  createConversation,
  listenToUserConversations,
  createOrUpdateUserInFirestore
} from "../utils/firebaseUtils";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const router = useRouter();
  const { user, isLoaded  } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      createOrUpdateUserInFirestore(user.id, user.emailAddresses[0].emailAddress, user.fullName);
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (isLoaded && user) {
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
  }, [user, currentConversation, router]);

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

  // const addMessage = async (message) => {
  //   if (!currentConversation) return;

  //   const updatedMessages = [...currentConversation.messages, message];
  //   await updateConversation(currentConversation.id, updatedMessages);

  //   setCurrentConversation((prev) => ({ ...prev, messages: updatedMessages }));
  // };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        currentConversation,
        startNewConversation,
        setCurrentConversation,
        // addMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
