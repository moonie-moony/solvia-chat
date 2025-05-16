const socket = io();

let currentUser = null;
let currentChat = 'public'; // 'public' or friend's username
let friends = [];
let friendRequests = [];

// DOM elements
const usernameModal = document.getElementById('usernameModal');
const usernameInput = document.getElementById('usernameInput');
const usernameSubmit = document.getElementById('usernameSubmit');

const chatHeader = document.getElementById('chatHeader');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');

const friendListElem = document.getElementById('friendList');
const friendRequestsElem = document.getElementById('friendRequests');

const btnPublicChat = document.getElementById('btnPublicChat');
const btnAddFriend = document.getElementById('btnAddFriend');
const addFriendInput = document.getElementById('addFriendInput');

usernameSubmit.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  if (!username) {
    alert('Please enter a username');
    return;
  }
  currentUser = username;
  socket.emit('set username', currentUser);
  usernameModal.style.display = 'none';
  chatHeader.textContent = 'Public Chat';
  loadInitialData();
});

function loadInitialData() {
  currentChat = 'public';
  btnPublicChat.classList.add('active');
  socket.emit('get friend list');
  socket.emit('get friend requests');
}

// Update friend list UI
function updateFriendList() {
  friendListElem.innerHTML = '';
  friends.forEach(friend => {
    const li = document.createElement('li');
    li.textContent = friend;
    li.addEventListener('click', () => {
      openPrivateChat(friend);
      highlightSelectedFriend(friend);
    });
    friendListElem.appendChild(li);
  });
}

// Highlight selected friend in list
function highlightSelectedFriend(friend) {
  const items = friendListElem.querySelectorAll('li');
  items.forEach(item => {
    if(item.textContent === friend){
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  btnPublicChat.classList.remove('active');
}

// Update friend requests UI
function updateFriendRequests() {
  friendRequestsElem.innerHTML = '';
  friendRequests.forEach(requester => {
    const li = document.createElement('li');
    li.textContent = requester;

    const acceptBtn = document.createElement('button');
    acceptBtn.textContent = 'Accept';
    acceptBtn.classList.add('accept-btn');
    acceptBtn.addEventListener('click', () => {
      socket.emit('accept friend request', requester);
    });

    li.appendChild(acceptBtn);
    friendRequestsElem.appendChild(li);
  });
}

// Render messages in chat window
function addMessageToChat(message, chatType) {
  const div = document.createElement('div');
  div.classList.add('message');
  if (message.from === currentUser) {
    div.classList.add('self');
  }
  div.innerHTML = `
    <div class="username">${escapeHTML(message.from)}</div>
    <div class="text">${escapeHTML(message.text)}</div>
    <div class="timestamp">${new Date(message.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
  `;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

// Open private chat
function openPrivateChat(friend) {
  currentChat = friend;
  chatHeader.textContent = `Chat with ${friend}`;
  chatMessages.innerHTML = '';
  socket.emit('get private messages', friend);
  highlightSelectedFriend(friend);
}

// Socket listeners

// Receive friend list
socket.on('friend list', (list) => {
  friends = list;
  updateFriendList();
});

// Receive friend requests
socket.on('friend requests', (requests) => {
  friendRequests = requests;
  updateFriendRequests();
});

// Receive private messages history
socket.on('private messages history', ({ chatKey, messages }) => {
  if (currentChat && chatKey === [currentUser, currentChat].sort().join('_')) {
    chatMessages.innerHTML = '';
    messages.forEach(msg => addMessageToChat(msg, 'private'));
  }
});

// Receive private message
socket.on('private message', ({ chatKey, message }) => {
  if (currentChat && chatKey === [currentUser, currentChat].sort().join('_')) {
    addMessageToChat(message, 'private');
  }
});

// Receive public messages
socket.on('public messages', (messages) => {
  if (currentChat === 'public') {
    chatMessages.innerHTML = '';
    messages.forEach(msg => addMessageToChat(msg, 'public'));
  }
});

// Receive a new public message
socket.on('public message', (message) => {
  if (currentChat === 'public') {
    addMessageToChat(message, 'public');
  }
});

// New friend request notification
socket.on('friend request received', (fromUser) => {
  friendRequests.push(fromUser);
  updateFriendRequests();
  alert(`New friend request from ${fromUser}`);
});

// Send message handler
chatForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  if (currentChat === 'public') {
    socket.emit('public message', text);
  } else {
    socket.emit('private message', { toUser: currentChat, text });
  }
  chatInput.value = '';
});

// Public chat button click
btnPublicChat.addEventListener('click', () => {
  currentChat = 'public';
  chatHeader.textContent = 'Public Chat';
  btnPublicChat.classList.add('active');
  clearFriendSelection();
  socket.emit('get public messages');
  chatMessages.innerHTML = '';
});

// Clear friend selection
function clearFriendSelection() {
  const items = friendListElem.querySelectorAll('li');
  items.forEach(item => item.classList.remove('active'));
  btnPublicChat.classList.remove('active');
}

// Add friend button
btnAddFriend.addEventListener('click', () => {
  const newFriend = addFriendInput.value.trim();
  if (!newFriend || newFriend === currentUser || friends.includes(newFriend)) {
    alert('Invalid username or already a friend.');
    return;
  }
  socket.emit('send friend request', newFriend);
  addFriendInput.value = '';
  alert(`Friend request sent to ${newFriend}`);
});
