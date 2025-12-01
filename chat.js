const socket = io('http://localhost:4000');
const chatInput = document.querySelector('.chat-input input');
const chatSend = document.querySelector('#chat-send');
const chatMessages = document.getElementById('chat-messages');

// Current logged-in user
let currentUser = {};
try {
  currentUser = JSON.parse(localStorage.getItem('ms_user_v5')) || {};
} catch (err) { currentUser = {}; }

function getUserName() {
  return currentUser?.firstName || 'Moi';
}

function addMessage(name, text, isOwn = false) {
  if (!text) return;
  const msgEl = document.createElement('div');
  msgEl.classList.add('chat-message');
  if (isOwn) msgEl.classList.add('own');
  msgEl.innerHTML = `<strong>${name}:</strong> ${text}`;
  chatMessages.appendChild(msgEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send message
chatSend.addEventListener('click', () => {
  const text = chatInput.value.trim();
  if (!text) return;

  const name = getUserName();
  const msgData = { name, text };

  addMessage(name, text, true); // show locally
  chatInput.value = '';

  socket.emit('chat message', msgData); // send to server
});

// Receive message from others
socket.on('chat message', (msgData) => {
  if (!msgData || !msgData.text) return;
  // Skip own messages (already displayed)
  if (msgData.name === getUserName()) return;

  addMessage(msgData.name || 'Autre', msgData.text);
});
