const socket = io();

// Elements
const usernameModal = document.getElementById('usernameModal');
const usernameInput = document.getElementById('usernameInput');
const usernameSubmit = document.getElementById('usernameSubmit');

const container = document.querySelector('.container');
const btnPublicChat = document.getElementById('btnPublicChat');
const btnFriendRequests = document.getElementById('btnFriendRequests');
const reqCountBadge = document.getElementById('reqCount');
const friendListEl = document.getElementById('friendList');
const addFriendInput = document.getElementById('addFriendInput');
const btnAddFriend = document.getElementById('btnAddFriend');

const chatHeader = document.getElementById('chatHeader');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = chatForm.querySelector('input');

const friendRequestsPanel = document.getElementById('friendRequestsPanel');
const friendRequestsList = document.getElementById('friendRequestsList');
const closeFriendRequestsBtn = document.getElementById('closeFriendRequestsBtn');

let username = null;
let currentChat = 'public'; // 'public' or friend's username
let friends = [];
let friendRequests = [];
let messages = {};  // Store messages by friend or 'public'

// Show username modal on load
function showUsernameModal() {
  usernameModal.classList.remove('hidden');
  container.classList.add('hidden');
  usernameInput.focus();
}

function hideUsernameModal() {
  usernameModal.classList.add('hidden');
  container.classList.remove('hidden');
}

// Add message to chat area, mark private messages
function addMessageToChat(sender, text, isPrivate = false, fromSelf = false) {
  const li = document.createElement('li');
  li.classList.toggle('private', isPrivate);
  li.classList.toggle('self', fromSelf);
  li.innerHTML = `<div><span class="sender">${sender}:</span><div class="text">${text}</div></div>`;
  chatMessages.appendChild(li);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Update friend list UI with active highlight
function updateFriendListUI() {
  friendListEl.innerHTML = '';
  friends.forEach(friend => {
    const li = document.createElement('li');
    li.textContent = friend;
    if (currentChat === friend) li.classList.add('active');
    li.addEventListener('click', () => {
      currentChat = friend;
      chatHeader.textContent = `Private chat with ${friend}`;
      loadMessagesForChat(friend);
      updateFriendListUI();
      btnPublicChat.classList.remove('active');
    });
    friendListEl.appendChild(li);
  });
}

// Update friend requests badge
function updateFriendRequestsUI() {
  const count = friendRequests.length;
  if (count > 0) {
    reqCountBadge.textContent = count;
    reqCountBadge.classList.remove('hidden');
  } else {
    reqCountBadge.classList.add('hidden');
  }
}

// Load messages for a chat (public or friend)
function loadMessagesForChat(chatName) {
  chatMessages.innerHTML = '';
  if (!messages[chatName]) return;
  messages[chatName].forEach(({ sender, text, isPrivate }) => {
    addMessageToChat(sender, text, isPrivate, sender === username);
  });
}

// Show friend requests panel
function showFriendRequestsPanel() {
  friendRequestsPanel.classList.remove('hidden');
  renderFriendRequests();
}

// Hide friend requests panel
function hideFriendRequestsPanel() {
  friendRequestsPanel.classList.add('hidden');
}

// Render friend requests list with Accept/Decline buttons
function renderFriendRequests() {
  friendRequestsList.innerHTML = '';
  friendRequests.forEach(requester => {
    const li = document.createElement('li');
    const nameSpan = document.createElement('span');
    nameSpan.classList.add('requesterName');
    nameSpan.textContent = requester;

    const acceptBtn = document.createElement('button');
    acceptBtn.textContent = 'Accept';
    acceptBtn.classList.add('requestBtn');
    acceptBtn.onclick = () => {
      socket.emit('friend_request_response', { from: requester, accept: true });
      removeFriendRequest(requester);
    };

    const declineBtn = document.createElement('button');
    declineBtn.textContent = 'Decline';
    declineBtn.classList.add('requestBtn');
    declineBtn.style.backgroundColor = '#b33a3a';
    declineBtn.onclick = () => {
      socket.emit('friend_request_response', { from: requester, accept: false });
      removeFriendRequest(requester);
    };

    li.appendChild(nameSpan);
    li.appendChild(acceptBtn);
    li.appendChild(declineBtn);
    friendRequestsList.appendChild(li);
  });
}

// Remove friend request from list and update UI
function removeFriendRequest(name) {
  friendRequests = friendRequests.filter(r => r !== name);
  updateFriendRequestsUI();
  renderFriendRequests();
}

// Handle sending friend request
btnAddFriend.onclick = () => {
  const friendToAdd = addFriendInput.value.trim();
  if (!friendToAdd) return alert('Enter a username to add');
  if (friendToAdd === username) return alert("You can't add yourself");
  if (friends.includes(friendToAdd)) return alert('Already friends');
  socket.emit('friend_request_send', friendToAdd);
  addFriendInput.value = '';
};

// Show public chat tab
btnPublicChat.onclick = () => {
  currentChat = 'public';
  chatHeader.textContent = 'Public Chat';
  loadMessagesForChat('public');
  updateFriendListUI();
  btnPublicChat.classList.add('active');
  btnFriendRequests.classList.remove('active');
  hideFriendRequestsPanel();
};

// Show friend requests panel on button click
btnFriendRequests.onclick = () => {
  showFriendRequestsPanel();
  btnFriendRequests.classList.add('active');
  btnPublicChat.classList.remove('active');
};

// Close friend requests panel
closeFriendRequestsBtn.onclick = () => {
  hideFriendRequestsPanel();
  btnFriendRequests.classList.remove('active');
};

// Handle chat form submission
chatForm.onsubmit = (e) => {
  e.preventDefault();
  const msg = chatInput.value.trim();
  if (!msg) return;

  if (currentChat === 'public') {
    socket.emit('public_message', msg);
    addMessageLocally(username, msg, false);
  } else {
    socket.emit('private_message', { to: currentChat, text: msg });
    addMessageLocally(username, msg, true);
  }

  chatInput.value = '';
};

// Add message locally to message store and chat area
function addMessageLocally(sender, text, isPrivate) {
  if (!messages[currentChat]) messages[currentChat] = [];
  messages[currentChat].push({ sender, text, isPrivate });
  if (currentChat === 'public' || sender === username) {
    addMessageToChat(sender, text, isPrivate, sender === username);
  }
}

// Socket listeners
socket.on('join_success', (name) => {
  username = name;
  hideUsernameModal();
  btnPublicChat.click();
});

socket.on('join_error', (msg) => {
  alert(msg);
  usernameInput.value = '';
  usernameInput.focus();
});

socket.on('public_message', ({ sender, text }) => {
  if (!messages['public']) messages['public'] = [];
  messages['public'].push({ sender, text, isPrivate: false });
  if (currentChat === 'public') addMessageToChat(sender, text, false);
});

socket.on('friend_request_received', (requester) => {
  if (!friendRequests.includes(requester)) {
    friendRequests.push(requester);
    updateFriendRequests






ChatGPT said:
');
btnPublicChat.classList.add('active');
};

// Submit username
usernameSubmit.onclick = () => {
const val = usernameInput.value.trim();
if (!val) return alert('Please enter a username');
username = val;
socket.emit('set_username', username);
hideUsernameModal();
btnPublicChat.click();
};

// Send chat message
chatForm.onsubmit = e => {
e.preventDefault();
const msg = chatInput.value.trim();
if (!msg) return;
if (currentChat === 'public') {
socket.emit('chat_message', msg);
// Save own public message
if (!messages.public) messages.public = [];
messages.public.push({ sender: username, text: msg, isPrivate: false });
addMessageToChat(username, msg, false, true);
} else {
// private message
socket.emit('private_message', { to: currentChat, message: msg });
if (!messages[currentChat]) messages[currentChat] = [];
messages[currentChat].push({ sender: username, text: msg, isPrivate: true });
addMessageToChat(username, msg, true, true);
}
chatInput.value = '';
};

// Socket events
socket.on('chat_message', ({ sender, message }) => {
if (!messages.public) messages.public = [];
messages.public.push({ sender, text: message, isPrivate: false });
if (currentChat === 'public') addMessageToChat(sender, message, false, sender === username);
});

socket.on('private_message', ({ from, message }) => {
if (!messages[from]) messages[from] = [];
messages[from].push({ sender: from, text: message, isPrivate: true });
// If private chat with sender open, show message
if (currentChat === from) addMessageToChat(from, message, true, false);
});

socket.on('friend_list', list => {
friends = list;
updateFriendListUI();
});

socket.on('friend_requests', requests => {
friendRequests = requests;
updateFriendRequestsUI();
if (requests.length > 0) {
// Optionally alert user or update UI badge
}
});

socket.on('friend_request_received', requester => {
friendRequests.push(requester);
updateFriendRequestsUI();
// Optional: show friend requests panel automatically or notification
});
