import { useState, useContext } from "react"
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Typography,
  Collapse,
} from "@mui/material"
import { Delete } from "@mui/icons-material"
import { ChatContext } from "../context/ChatContext"
import { deleteConversation } from "../utils/firebaseUtils"
import { useRouter } from "next/navigation"
import { useUser, SignOutButton } from "@clerk/nextjs"
import Image from "next/image"

export default function Sidebar() {
  const {
    conversations,
    currentConversation,
    setCurrentConversation,
    startNewConversation,
  } = useContext(ChatContext)
  const router = useRouter()
  const [isModalOpen, setModalOpen] = useState(false)
  const [bobaShopUrl, setBobaShopUrl] = useState("")
  const [showSignOut, setShowSignOut] = useState(false)
  const { user, isLoaded, isSignedIn } = useUser()

  const handleDeleteConversation = async (conversationId) => {
    await deleteConversation(conversationId)

    if (currentConversation?.id === conversationId) {
      if (conversations.length > 1) {
        const nextConversation = conversations.find(
          (conv) => conv.id !== conversationId
        )
        setCurrentConversation(nextConversation)
        router.push(`/conversation/${nextConversation.id}`)
      } else {
        setCurrentConversation(null)
        router.push("/")
      }
    }
  }

  const getConversationTitle = (conversation) => {
    if (conversation.messages && conversation.messages.length > 0) {
      const firstMessage = conversation.messages[0].content
      return firstMessage.split(" ").slice(0, 5).join(" ") + "..."
    }
    return "New Conversation"
  }

  const handleAddBobaShop = async () => {
    try {
      const response = await fetch("/api/bobaShop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ url: bobaShopUrl })
      })

      const result = await response.json()
      if (response.ok) {
        alert("Boba shop data added successfully!")
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error("Failed to add boba shop:", error)
      alert("An error occurred while adding the boba shop.")
    } finally {
      setModalOpen(false)
      setBobaShopUrl("")
    }
  }

  const handleUserMenuClick = () => {
    setShowSignOut((prev) => !prev)
  }

  let displayName = "User"
  if (isLoaded) {
    if (isSignedIn && user) {
      if (user.firstName && user.lastName) {
        displayName = `${user.firstName} ${user.lastName}`
      } else if (user.emailAddresses && user.emailAddresses.length > 0) {
        displayName = user.emailAddresses[0].emailAddress
      }
    }
  }

  return (
    <Box
      width="300px"
      bgcolor="grey.200"
      p={2}
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      height="100vh"
    >
      <Box>
        <Button variant="contained" fullWidth onClick={startNewConversation}>
          New Conversation
        </Button>
        <Button
          variant="outlined"
          fullWidth
          sx={{ mt: 2 }}
          onClick={() => setModalOpen(true)}
        >
          Add Boba Shop
        </Button>
        <List>
          {conversations.map((conversation) => (
            <ListItem
              key={conversation.id}
              disablePadding
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDeleteConversation(conversation.id)}
                >
                  <Delete />
                </IconButton>
              }
            >
              <ListItemButton
                onClick={() => {
                  setCurrentConversation(conversation)
                  router.push(`/conversation/${conversation.id}`)
                }}
              >
                <ListItemText primary={getConversationTitle(conversation)} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      <Box>
        {isLoaded && isSignedIn && user ? (
          <>
            <Button
              fullWidth
              sx={{ justifyContent: "flex-start" }}
              onClick={handleUserMenuClick}
              startIcon={
                <Image
                  src={user.imageUrl || "/default-avatar.png"}
                  alt="User Avatar"
                  width={24}
                  height={24}
                  style={{ borderRadius: "50%" }}
                />
              }
            >
              <Typography variant="body1">{displayName}</Typography>
            </Button>

            <Collapse in={showSignOut}>
              <Box mt={1} display="flex" justifyContent="flex-start">
                <SignOutButton>
                  <Button variant="contained" color="secondary" size="small">
                    Sign Out
                  </Button>
                </SignOutButton>
              </Box>
            </Collapse>
          </>
        ) : (
          <Typography variant="body1">Loading...</Typography>
        )}
      </Box>

      <Dialog open={isModalOpen} onClose={() => setModalOpen(false)}>
        <DialogTitle>Add Boba Shop</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Boba Shop URL"
            type="url"
            fullWidth
            value={bobaShopUrl}
            onChange={(e) => setBobaShopUrl(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleAddBobaShop} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
