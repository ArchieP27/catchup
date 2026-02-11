let stompClient = null;
let typingTimeout = null;
let currentChatTarget = null;
let lastDate = null;
let chattedUsers = new Set();
const currentUsername = document.getElementById("currentUser").innerText;

function connect() {
  const socket = new SockJS("/ws");
  stompClient = Stomp.over(socket);
  stompClient.connect({}, function (frame) {
    stompClient.subscribe("/topic/users", function (response) {
      updateUserList(JSON.parse(response.body));
    });
    stompClient.send("/app/chat.newUser", {}, {});
    console.log("Connected: " + frame);
    loadRecentChats();
    if (!currentChatTarget) {
      loadAndDisplayHistory();
    }
    stompClient.subscribe("/user/queue/messages", function (response) {
      const msg = JSON.parse(response.body);
      if (
        currentChatTarget &&
        (msg.username === currentChatTarget ||
          msg.recipient === currentChatTarget)
      ) {
        showMessage(msg);
      }
      updateRecentChats(msg);
    });
    stompClient.subscribe("/topic/public", function (response) {
      const msg = JSON.parse(response.body);
      if (!currentChatTarget) {
        showMessage(msg);
      }
    });
    stompClient.subscribe("/user/queue/typing", function (response) {
      showTypingIndicator(response.body);
    });
  });
}

function goPublic() {
  currentChatTarget = null;
  document.getElementById("chat-with-name").innerText = "Public Chat Room";
  document.getElementById("typing-indicator").innerText = "";
  loadAndDisplayHistory();
}

async function loadAndDisplayHistory() {
  const response = await fetch("/messages");
  const messages = await response.json();
  document.getElementById("messages").innerHTML = "";
  lastDate = null;
  messages.forEach((msg) => showMessage(msg));
}

async function startPrivateChat(targetUser) {
  currentChatTarget = targetUser;
  document.getElementById("chat-with-name").innerText = targetUser;
  document.getElementById("typing-indicator").innerText = "";
  document.getElementById("messages").innerHTML = "";
  lastDate = null;

  try {
    const response = await fetch(`/messages/private?otherUser=${targetUser}`);
    const messages = await response.json();
    messages.forEach((msg) => showMessage(msg));
  } catch (error) {
    console.error("Could not load private history:", error);
  }
}

function handleKeyPress(e) {
  if (e.key === "Enter") {
    sendMessage();
  } else {
    sendTypingSignal();
  }
}

function sendTypingSignal() {
  if (stompClient && stompClient.connected) {
    const payload = {
      recipient: currentChatTarget ? currentChatTarget : "PUBLIC",
    };
    stompClient.send("/app/chat.typing", {}, JSON.stringify(payload));
  }
}

function sendStopTyping() {
  if (stompClient && currentChatTarget && currentChatTarget !== "PUBLIC") {
    stompClient.send("/app/chat.stopTyping", {}, currentChatTarget);
  }
}

function sendMessage() {
  const input = document.getElementById("message");
  const content = input.value.trim();

  if (content && stompClient) {
    const chatMessage = {
      content: content,
      recipient: currentChatTarget,
      type: currentChatTarget ? "PRIVATE" : "PUBLIC",
    };

    stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
    stompClient.send(
      "/app/chat.stopTyping",
      {},
      currentChatTarget ? currentChatTarget : "PUBLIC",
    );
    document.getElementById("typing-indicator").innerText = "";
    clearTimeout(typingTimeout);
    input.value = "";
  }
}

function showMessage(msg) {
  const messagesDiv = document.getElementById("messages");
  const isMe = msg.username === currentUsername;

  const msgDateObj = new Date(msg.timestamp);
  const dateString = msgDateObj.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (dateString !== lastDate) {
    const divider = document.createElement("div");
    divider.className = "text-center my-3";
    divider.innerHTML = `<span class="badge bg-secondary opacity-75">${dateString}</span>`;
    messagesDiv.appendChild(divider);
    lastDate = dateString;
  }
  const wrapper = document.createElement("div");
  wrapper.className = isMe
    ? "message-wrapper me-wrapper"
    : "message-wrapper others-wrapper";
  const time = msgDateObj.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  wrapper.innerHTML = `
        <span style="font-size: 0.7rem; color: #888; margin-bottom: 4px;">${isMe ? "You" : msg.username}</span>
        <div class="message ${isMe ? "message-me" : "message-others"}">
            ${msg.content}
            <div style="font-size: 0.6rem; margin-top: 5px; opacity: 0.8; text-align: right;">${time}</div>
        </div>
    `;

  messagesDiv.appendChild(wrapper);
  messagesDiv.scrollTo({
    top: messagesDiv.scrollHeight,
    behavior: "smooth",
  });
}

let globalOnlineUsers = new Set();

function updateUserList(users) {
  globalOnlineUsers = new Set(users);

  const userList = document.getElementById("user-list");
  userList.innerHTML = "";

  users.forEach((user) => {
    if (user === currentUsername) return;

    const li = document.createElement("li");
    li.className = "mb-2 d-flex align-items-center small";
    li.innerHTML = `<span class="status-dot online online-pulse"></span> ${user}`;
    userList.appendChild(li);
  });
  refreshAllStatusDots();
}

function refreshAllStatusDots() {
  const allUserItems = document.querySelectorAll(
    "#recent-chats li, #search-results li",
  );

  allUserItems.forEach((item) => {
    const username =
      item.querySelector("strong")?.innerText ||
      item.querySelector("span")?.innerText;
    const existingDot = item.querySelector(".status-dot");
    if (existingDot) existingDot.remove();
    const dot = document.createElement("span");
    if (globalOnlineUsers.has(username)) {
      dot.className = "status-dot online online-pulse";
    } else {
      dot.className = "status-dot offline";
    }
    item.insertBefore(dot, item.firstChild);
  });
}

function showTypingIndicator(message) {
  const indicator = document.getElementById("typing-indicator");
  if (message.startsWith("STOP:")) {
    const userWhoStopped = message.split(":")[1];
    if (
      userWhoStopped === currentChatTarget ||
      (!currentChatTarget && message === "PUBLIC")
    ) {
      indicator.innerText = "";
    }
    return;
  }
  if (message === currentChatTarget) {
    indicator.innerText = message + " is typing...";
  } else if (!currentChatTarget && message === "PUBLIC") {
    indicator.innerText = "Someone is typing...";
  }
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    indicator.innerText = "";
  }, 2000);
}

async function searchPeople() {
  const query = document.getElementById("userSearch").value;
  const resultsList = document.getElementById("search-results");
  if (query.length < 2) {
    resultsList.innerHTML = "";
    return;
  }
  const response = await fetch(`/users/search?query=${query}`);
  const users = await response.json();
  resultsList.innerHTML = "";
  users.forEach((username) => {
    const li = document.createElement("li");
    li.className = "mb-2 d-flex justify-content-between align-items-center";
    li.innerHTML = `<span>${username}</span><button class="btn btn-sm btn-outline-primary" onclick="startPrivateChat('${username}')">Chat</button>`;
    resultsList.appendChild(li);
  });
}

function updateRecentChats(msg) {
  const otherUser =
    msg.username === currentUsername ? msg.recipient : msg.username;
  if (!otherUser || otherUser === "PUBLIC" || otherUser === currentUsername)
    return;

  let li = document.getElementById(`recent-${otherUser}`);

  if (!li) {
    chattedUsers.add(otherUser);
    const list = document.getElementById("recent-chats");
    li = document.createElement("li");
    li.id = `recent-${otherUser}`;
    li.className =
      "p-2 mb-1 bg-white rounded shadow-sm border-start border-4 border-success d-flex justify-content-between align-items-center";
    li.style.cursor = "pointer";
    li.innerHTML = `<strong>${otherUser}</strong> <span class="badge rounded-pill bg-danger d-none">0</span>`;
    li.innerHTML = `<span class="status-dot ${globalOnlineUsers.has(otherUser) ? "online online-pulse" : "offline"}"></span><strong>${otherUser}</strong> <span class="badge rounded-pill bg-danger d-none">0</span>`;
    li.onclick = () => {
      li.querySelector(".badge").classList.add("d-none");
      li.querySelector(".badge").innerText = "0";
      startPrivateChat(otherUser);
    };
    list.appendChild(li);
  }
  if (currentChatTarget !== otherUser && msg.username !== currentUsername) {
    const badge = li.querySelector(".badge");
    badge.classList.remove("d-none");
    badge.innerText = parseInt(badge.innerText) + 1;
  }
}

async function loadRecentChats() {
  const response = await fetch("/messages/all-private-contacts");
  const contacts = await response.json();
  contacts.forEach((contact) => {
    updateRecentChats({ username: contact, recipient: currentUsername });
  });
}

window.onload = connect;
