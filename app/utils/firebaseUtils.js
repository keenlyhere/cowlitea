import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/firebase";

export const createConversation = async (userId, messages = []) => {
  const newConversation = {
    userId,
    messages,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return await addDoc(collection(db, "conversations"), newConversation);
};

export const updateConversation = async (conversationId, messages) => {
  return await updateDoc(doc(db, "conversations", conversationId), {
    messages,
    updatedAt: new Date(),
  });
};

export const deleteConversation = async (conversationId) => {
  return await deleteDoc(doc(db, "conversations", conversationId));
};

export const fetchConversationById = async (conversationId) => {
  const docRef = doc(db, "conversations", conversationId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const listenToUserConversations = (userId, callback) => {
  const q = query(collection(db, "conversations"), where("userId", "==", userId));
  return onSnapshot(q, callback);
};
