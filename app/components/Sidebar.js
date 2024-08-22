import { useState, useContext } from "react";
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
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import { ChatContext } from "../context/ChatContext";
import { deleteConversation } from "../utils/firebaseUtils";
import { useRouter } from "next/navigation";
import { useUser, SignOutButton } from "@clerk/nextjs";

export default function Sidebar() {
  const { conversations, currentConversation, setCurrentConversation, startNewConversation } =
    useContext(ChatContext);
  const router = useRouter();
  const [isModalOpen, setModalOpen] = useState(false);
  const [professorUrl, setProfessorUrl] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, isLoaded, isSignedIn } = useUser();

  const handleDeleteConversation = async (conversationId) => {
    await deleteConversation(conversationId);

    if (currentConversation?.id === conversationId) {
      if (conversations.length > 1) {
        const nextConversation = conversations.find((conv) => conv.id !== conversationId);
        setCurrentConversation(nextConversation);
        router.push(`/conversation/${nextConversation.id}`);
      } else {
        setCurrentConversation(null);
        router.push("/");
      }
    }
  };

  const getConversationTitle = (conversation) => {
    if (conversation.messages && conversation.messages.length > 0) {
      const firstMessage = conversation.messages[0].content;
      return firstMessage.split(" ").slice(0, 5).join(" ") + "...";
    }
    return "New Conversation";
  };

  const handleAddProfessor = async () => {
    try {
      const response = await fetch("/api/professor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: professorUrl }),
      });

      const result = await response.json();
      if (response.ok) {
        alert("Professor data added successfully!");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Failed to add professor:", error);
      alert("An error occurred while adding the professor.");
    } finally {
      setModalOpen(false);
      setProfessorUrl("");
    }
  };

  const handleUserMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  // display name
  let displayName = "User";
  if (isLoaded) {
    if (isSignedIn && user) {
      if (user.firstName && user.lastName) {
        displayName = `${user.firstName} ${user.lastName}`;
      } else if (user.emailAddresses && user.emailAddresses.length > 0) {
        displayName = user.emailAddresses[0].emailAddress;
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
      {/* Top Section */}
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
          Add Professor
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
                  setCurrentConversation(conversation);
                  router.push(`/conversation/${conversation.id}`);
                }}
              >
                <ListItemText primary={getConversationTitle(conversation)} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* User Info and Sign Out Button */}
      <Box>
        {isLoaded && isSignedIn && user ? (
          <>
            <Button
              fullWidth
              sx={{ justifyContent: "flex-start" }}
              onClick={handleUserMenuClick}
              startIcon={
                user.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt="User Avatar"
                    style={{ width: 24, height: 24, borderRadius: "50%" }}
                  />
                ) : null
              }
            >
              <Typography variant="body1">{displayName}</Typography>
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleUserMenuClose}
            >
              <MenuItem onClick={handleUserMenuClose}>
                <SignOutButton />
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Typography variant="body1">Loading...</Typography>
        )}
      </Box>

      {/* Modal for Adding a Professor */}
      <Dialog open={isModalOpen} onClose={() => setModalOpen(false)}>
        <DialogTitle>Add Professor</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="RateMyProfessors URL"
            type="url"
            fullWidth
            value={professorUrl}
            onChange={(e) => setProfessorUrl(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleAddProfessor} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
