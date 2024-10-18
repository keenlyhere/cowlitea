import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, onSnapshot, query, where, setDoc } from "firebase/firestore"
import { db } from "@/firebase"

export const createOrUpdateUserInFirestore = async (userId, email, displayName = "") => {
  const userRef = doc(db, "users", userId)
  const userData = {
    email: email,
    createdAt: new Date(),
  }
  return await setDoc(userRef, userData, { merge: true })
}
export const fetchUserById = async (userId) => {
  const userRef = doc(db, "users", userId)
  const userDoc = await getDoc(userRef)
  return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null
}

export const createConversation = async (userId, messages = []) => {
  const newConversation = {
    userId,
    messages,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  return await addDoc(collection(db, "conversations"), newConversation)
}

export const updateConversation = async (conversationId, messages) => {
  return await updateDoc(doc(db, "conversations", conversationId), {
    messages,
    updatedAt: new Date(),
  })
}

export const deleteConversation = async (conversationId) => {
  return await deleteDoc(doc(db, "conversations", conversationId))
}

export const fetchConversationById = async (conversationId) => {
  const docRef = doc(db, "conversations", conversationId)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
}

export const listenToUserConversations = (userId, callback) => {
  const q = query(collection(db, "conversations"), where("userId", "==", userId))
  return onSnapshot(q, callback)
}
