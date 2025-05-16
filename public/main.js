let currentChat = "public";
const friends = ["Friend 1", "Friend 2"];
const requests = ["NewFriend"];

const chatMessages = {
  public: [],
  "Friend 1": [],
  "Friend 2": [],
};

function switchChat(name) {
  currentChat = name;
  document.getElementById("chatHeader").textContent = name;
  renderMessages();
}

function sendMessage() {
  const input = document.getElementById("messageInput");
  if (input.value.trim() === "") return;

  chatMessages[currentChat].push({
    text: input.value,
    self: true,
  });

  input.value = "";
  renderMessages();
}

function renderMessages() {
  const messagesDiv = document.getElementById("chatMessages");
  messagesDiv.innerHTML = "";

  chatMessages[currentChat].forEach((msg) => {
    const div = document.createElement("div");
    div.className = "message" + (msg.self ? " self" : "");
    div.textContent = msg.text;
    messagesDiv.appendChild(div);
  });

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function renderFriends() {
  const list = document.getElementById("friendsList");
  friends.forEach((f) => {
    const btn = document.createElement("button");
    btn.className = "friend";
    btn.textContent = f;
    btn.onclick = () => switchChat(f);
    list.appendChild(btn);
  });
}

function renderRequests() {
  const list = document.getElementById("requestsList");
  requests.forEach((req) => {
    const btn = document.createElement("button");
    btn.className = "friend";
    btn.textContent = `${req} (Add)`;
    btn.onclick = () => {
      friends.push(req);
      requests.splice(requests.indexOf(req), 1);
      list.innerHTML = "";
      document.getElementById("friendsList").innerHTML = "";
      renderFriends();
      renderRequests();
    };
    list.appendChild(btn);
  });
}

renderFriends();
renderRequests();
renderMessages();
