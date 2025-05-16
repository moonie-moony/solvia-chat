(() => {
  const socket = io();

  // Elements
  const usernameModal = document.getElementById('usernameModal');
  const usernameInput = document.getElementById('usernameInput');
  const usernameSubmit = document.getElementById('usernameSubmit');
  const container = document.querySelector('.container');

  const btnPublicChat = document.getElementById('btnPublicChat');
  const btnFriendRequests = document.getElementById('btnFriendRequests');
  const reqCount = document.getElementById('reqCount');

  const friendList = document.getElementById('friendList');
  const addFriendInput = document.getElementById('addFriendInput');
  const btnAddFriend = document.getElementById('btnAddFriend');

  const chatHeader = document.getElementById('chatHeader');
  const chatMessages = document.getElementById('chatMessages');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');

  // State
  let username = null;
  let currentChat = 'public'; // 'public', 'requests', or friend username
  let friends = [];
  let friendRequests = [];

  // Utils
  const formatTime = (date = new Date()) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const create






ChatGPT said:
MessageElement = (msg, isSelf = false) => {
const li = document.createElement('li');
li.classList.add(isSelf ? 'self' : 'other');
li.innerHTML = <div class="username">${msg.from}</div> <div class="text">${msg.text}</div> <div class="timestamp">${formatTime(new Date(msg.time))}</div> ;
return li;
};

// Join chat
usernameSubmit.onclick = () => {
const val = usernameInput.value.trim();
if (!val) return usernameInput.focus();
username = val;
usernameModal.style.display = 'none';
container.style.display = 'flex';
socket.emit('join', username);
};

usernameInput.addEventListener('keyup', e => {
if (e.key === 'Enter') usernameSubmit.click();
});

// Friend requests UI update
const updateRequestsUI = () => {
if (friendRequests.length > 0) {
reqCount.textContent = friendRequests.length;
reqCount.classList.add('show');
} else {
reqCount.textContent = '';
reqCount.classList.remove('show');
}
};

// Update friend list UI
const updateFriendsUI = () => {
friendList.innerHTML = '';
friends.forEach(friend => {
const li = document.createElement('li');
li.textContent = friend;
li.onclick = () => {
currentChat = friend;
chatHeader.textContent = Chat with ${friend};
chatMessages.innerHTML = '';
// Request chat history with friend or implement logic here
};
friendList.appendChild(li);
});
};

// Switch to public chat
btnPublicChat.onclick = () => {
currentChat = 'public';
chatHeader.textContent = 'Public Chat';
chatMessages.innerHTML = '';
btnPublicChat.classList.add('active');
btnFriendRequests.classList.remove('active');
};

// Show friend requests (stub)
btnFriendRequests.onclick = () => {
currentChat = 'requests';
chatHeader.textContent = 'Friend Requests';
chatMessages.innerHTML = '';
btnFriendRequests.classList.add('active');
btnPublicChat.classList.remove('active');
// Show friend requests messages or UI here
};

// Add friend button
btnAddFriend.onclick = () => {
const friendName = addFriendInput.value.trim();
if (!friendName) return;
// Emit friend request to server
socket.emit('friendRequest', { from: username, to: friendName });
addFriendInput.value = '';
};

// Send chat message
chatForm.onsubmit = e => {
e.preventDefault();
const msg = chatInput.value.trim();
if (!msg) return;
if (currentChat === 'public') {
socket.emit('publicMessage', { from: username, text: msg, time: Date.now() });
} else if (currentChat !== 'requests') {
socket.emit('privateMessage', { from: username, to: currentChat, text: msg, time: Date.now() });
}
chatInput.value = '';
};

// Receive public message
socket.on('publicMessage', msg => {
if (currentChat === 'public') {
const li = createMessageElement(msg, msg.from === username);
chatMessages.appendChild(li);
chatMessages.scrollTop = chatMessages.scrollHeight;
}
});

// Receive private message
socket.on('privateMessage', msg => {
if (currentChat === msg.from || currentChat === msg.to) {
const li = createMessageElement(msg, msg.from === username);
chatMessages.appendChild(li);
chatMessages.scrollTop = chatMessages.scrollHeight;
}
});

// Receive friend requests update
socket.on('friendRequests', requests => {
friendRequests = requests;
updateRequestsUI();
});

// Receive updated friends list
socket.on('friendsList', list => {
friends = list;
updateFriendsUI();
});

})();
