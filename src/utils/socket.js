import { io } from 'socket.io-client';

const BACKEND_URL = 'https://winstrikebackend.mixmall.uz';

const socket = io(BACKEND_URL, {
    transports: ['polling'],  // Faqat polling ishlatamiz
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    auth: {
      token: () => localStorage.getItem('token')
    }
});

// Ulanish hodisalarini tinglash
socket.on('connect', () => {
    console.log('Connected to Socket.IO server');
});

socket.on('connect_error', (error) => {
    console.error('Socket.IO ulanish xatosi:', error);
});

socket.on('disconnect', (reason) => {
    console.log('Disconnected from Socket.IO server:', reason);
});

export default socket;
