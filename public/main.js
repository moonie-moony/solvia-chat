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

let username = null;
let currentChat = 'public'; // 'public' or friend's username
let friends = [];
let friendRequests = [];

function showUsernameModal() {
  usernameModal.classList.remove('hidden');
  container.classList.add('hidden');
  usernameInput.focus();
}

function hideUsernameModal() {
  usernameModal.classList.add('hidden');
  container.classList.remove('hidden');
}

function addMessageToChat(sender, text, isPrivate = false) {
  const li = document.createElement('li');
  li.innerHTML = `<span class="sender">${sender}:</span> <span class="text">${text}</span>`;
  if (isPrivate) li.style.color = '#ffcc00';
  chatMessages.appendChild(li);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateFriendListUI() {
  friendListEl.innerHTML = '';
  friends.forEach(friend => {
    const li = document.createElement('li');
    li.textContent = friend;
    if (currentChat === friend) li.classList.add('active');
    li.addEventListener('click', () => {
      currentChat = friend;
      chatHeader.textContent = `Private chat with ${friend}`;
      chatMessages.innerHTML = '';
      updateFriendListUI();
    });
    friendListEl.appendChild(li);
  });
}

function updateFriendRequestsUI() {
  const count = friendRequests.length;
  if (count > 0) {
    reqCountBadge.textContent = count;
    reqCountBadge.classList.remove('hidden');
  } else {
    reqCountBadge.classList.add('hidden');
  }
}

usernameSubmit.onclick = () => {
  const val = usernameInput.value.trim();
  if (!val) return alert('Username cannot be empty');
  socket.emit('join', val);
};

usernameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') usernameSubmit.click();
});

btnPublicChat.onclick = () => {
  currentChat = 'public';
  chatHeader.textContent = 'Public Chat';
  chatMessages.innerHTML = '';
  updateFriendListUI();
  btnPublicChat.classList.add('active');
  btnFriendRequests.classList.remove('active');
};

btnFriendRequests.onclick = () => {
  alert('Friend requests:\n' + (friendRequests.length ? friendRequests.join('\n') : 'No requests'));
};

btnAddFriend.onclick = () => {
  const friendToAdd = addFriendInput.value.trim();
  if (!friendToAdd) return alert('Enter a username to add');
  if (friendToAdd === username) return alert("You can't add yourself");
  if (friends.includes(friendToAdd)) return alert('Already friends');
  socket.emit('friend_request_send', friendToAdd);
  addFriendInput.value = '';
};

chatForm.onsubmit = (e) => {
  e.preventDefault();
  const msg = chatInput.value.trim();
  if (!msg) return;

  if (currentChat === 'public') {
    socket.emit('public_message', msg);
  } else {
    socket.emit('private_message', { to: currentChat, text: msg });
  }

  chatInput.value = '';
};

// Socket listeners
socket.on('join_success', (name) => {
  username = name;
  hideUsernameModal();
});

socket.on('join_error', (msg) => {
  alert(msg);
  usernameInput.value = '';
  usernameInput.focus();
});

socket.on('public_message', ({ sender, text }) => {
  if (currentChat === 'public') addMessageToChat(sender, text, false);
});

socket.on('friend_request_received', (target) => {
  if (target === username) {
    friendRequests.push(target);
    updateFriendRequestsUI();
  }
});

socket.on('friend_request_accepted', ({ user1, user2 }) => {
  if (user1 === username) {
    friends.push(user2);
    updateFriendListUI();
  }
  if (user2 === username) {
    friends.push(user1);
    updateFriendListUI();
  }
});

socket.on('friend_list', (friendArray) => {
  friends = friendArray;
  updateFriendListUI();
});

socket.on('private_message', ({ sender, text }) => {
  if (currentChat === sender) {
    addMessageToChat(sender, text, true);
  }
});

showUsernameModal();
