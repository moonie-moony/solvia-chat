const socket = io();

const usernameModal = document.getElementById("usernameModal");
const usernameInput = document.getElementById("usernameInput");
const usernameSubmit = document.getElementById("usernameSubmit");

const container = document.querySelector(".container");
const btnPublicChat = document.getElementById("btnPublicChat");
const btnFriendRequests = document.getElementById("btnFriendRequests");
const reqCount = document.getElementById("reqCount");

const friendList = document.getElementById("friendList");
const addFriendInput = document.getElementById("addFriendInput");
const btnAddFriend = document.getElementById("btnAddFriend");

const chatHeader = document.getElementById("chatHeader");
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");

let username = null;
let currentChat = "public"; // "public" or friend's username
let friends = [];
let friendRequests = [];

// Utility: format time as HH:MM
function formatTime(date) {
  return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
}

// Display message in chatMessages
function addMessage({from, message, time, self = false}) {
  const li = document.createElement("li");
  li.textContent = `${from}: ${message}`;
  li.classList.toggle("self", self);
  
  const timestamp = document.createElement("span");
  timestamp.classList.add("timestamp");
  timestamp.textContent = formatTime(new Date(time));
  li.appendChild(timestamp);

  chatMessages.appendChild(li);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Update friend list UI
function updateFriendList() {
  friendList.innerHTML = "";

  if (currentChat === "public") {
    friends.forEach(friend => {
      const li = document.createElement("li");
      li.textContent = friend;
      li.addEventListener("click", () => {
        currentChat = friend;
        chatHeader.textContent = `Chat with ${friend}`;
        chatMessages.innerHTML = "";
        socket.emit("load_private_history", friend);
        updateFriendList();
      });
      friendList.appendChild(li);
    });
  } else if (currentChat === "requests") {
    if (friendRequests.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No friend requests";
      friendList.appendChild(li);
    } else {
      friendRequests.forEach(req => {
        const li = document.createElement("li");
        li.textContent = req;

        const acceptBtn = document.createElement("button");
        acceptBtn.textContent = "Accept";
        acceptBtn.classList.add("remove-friend");
        acceptBtn.style.backgroundColor = "#4caf50";
        acceptBtn.addEventListener("click", () => {
          socket.emit("accept_friend_request", req);
        });

        const rejectBtn = document.createElement("button");
        rejectBtn.textContent = "Reject";
        rejectBtn.classList.add("remove-friend");
        rejectBtn.style.backgroundColor = "#f44336";
        rejectBtn.addEventListener("click", () => {
          socket.emit("reject_friend_request", req);
        });

        li.appendChild(acceptBtn);
        li.appendChild(rejectBtn);
        friendList.appendChild(li);
      });
    }
  } else {
    // In private chat, highlight current friend and show Remove button
    friends.forEach(friend => {
      const li = document.createElement("li");
      li.textContent = friend;
      if (friend === currentChat) {
        li.classList.add("active");
      }
      li.addEventListener("click", () => {
        currentChat = friend;
        chatHeader.textContent = `Chat with ${friend}`;
        chatMessages.innerHTML = "";
        socket.emit("load_private_history", friend);
        updateFriendList();
      });

      if (friend === currentChat) {
        const removeBtn = document.createElement("button");
        removeBtn.textContent = "X";
        removeBtn.classList.add("remove-friend");
        removeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (confirm(`Remove friend ${friend}?`)) {
            socket.emit("remove_friend", friend);
            currentChat = "public";
            chatHeader.textContent = "Public Chat";
            chatMessages.innerHTML = "";
          }
        });
        li.appendChild(removeBtn);
      }

      friendList.appendChild(li);
    });
  }
}

// Show friend requests count badge
function updateRequestCount() {
  if (friendRequests.length > 0) {
    reqCount.style.display = "inline-block";
    reqCount.textContent = friendRequests.length;
  } else {
    reqCount.style.display = "none";
  }
}

// Handle username submit
usernameSubmit.addEventListener("click", () => {
  const name = usernameInput.value.trim();
  if (!name) return alert("Please enter a username");
  username = name;
  socket.emit("set_username", username);
});

usernameInput.addEventListener("keypress", e => {
  if (e.key === "Enter") usernameSubmit.click();
});

// On username accepted by server
socket.on("username_ok", (data) => {
  usernameModal.style.display = "none";
  container.style.display = "flex";
  friends = data.friends || [];
  friendRequests = data.friendRequests || [];
  updateRequestCount();
  updateFriendList();
  currentChat = "public";
  chatHeader.textContent = "Public Chat";
  chatMessages.innerHTML = "";
});

// On username rejected (taken)
socket.on("username_taken", () => {
  alert("Username already taken, please choose another.");
});

// Listen for friend requests update
socket.on("update_friend_requests", (requests) => {
  friendRequests = requests;
  updateRequestCount();
  if (currentChat === "requests") updateFriendList();
});

// Listen for friends list update
socket.on("update_friends", (newFriends) => {
  friends = newFriends;
  updateFriendList();
});

// Switch to public chat
btnPublicChat.addEventListener("click", () => {
  currentChat = "public";
  chatHeader.textContent = "Public Chat";
  chatMessages.innerHTML = "";
  updateFriendList();
});

// Switch to friend requests view
btnFriendRequests.addEventListener("click", () => {
  currentChat = "requests";
  chatHeader.textContent = "Friend Requests";
  chatMessages.innerHTML = "";
  updateFriendList();
});

// Add friend
btnAddFriend.addEventListener("click", () => {
  const friendName = addFriendInput.value.trim();
  if (!friendName) return;
  socket.emit("send_friend_request", friendName);
  addFriendInput.value = "";
});

// Handle chat form submit (send message)
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = chatInput.value.trim();
  if (!msg) return;

  if (currentChat === "public") {
    socket.emit("public_message", msg);
  } else if (currentChat !== "requests") {
    socket.emit("private_message", {to: currentChat, message: msg});
  }

  chatInput.value = "";
});

// Receive public message
socket.on("public_message", ({from, message, time}) => {
  if (currentChat === "public") {
    addMessage({from, message, time, self: from === username});
  }
});

// Receive private message
socket.on("private_message", ({from, message, time}) => {
  // Only show if chatting with that user or in public chat (optional)
  if (currentChat === from) {
    addMessage({from, message, time, self: false});
  }
});

// Receive private message sent confirmation (for self)
socket.on("private_message_sent", ({to, message, time}) => {
  if (currentChat === to) {
    addMessage({from: username, message, time, self: true});
  }
});

// Load private chat history
socket.on("private_history", (messages) => {
  chatMessages.innerHTML = "";
  messages.forEach(({from, message, time}) => {
    addMessage({from, message, time, self: from === username});
  });
});

// Alert friend request sent
socket.on("friend_request_sent", (to) => {
  alert(`Friend request sent to ${to}`);
});

// Alert friend request error
socket.on("friend_request_error", (msg) => {
  alert(msg);
});

// Alert general errors
socket.on("error_message", (msg) => {
  alert(msg);
});
