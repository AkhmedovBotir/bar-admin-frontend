import { io } from 'socket.io-client';

const BACKEND_URL = 'https://bar-admin-backend.onrender.com';

const socket = io(BACKEND_URL, {
    // Asosiy transport sozlamalari
    transports: ['polling'],
    upgrade: false,
    path: '/socket.io/',
    
    // Ulanish sozlamalari
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    timeout: 20000,
    
    // CORS sozlamalari
    withCredentials: false,
    
    // Auth
    auth: {
        token: localStorage.getItem('token')
    }
});

// Event listeners
socket.on('connect', () => {
    console.log('Socket serverga ulandi');
});

socket.on('connect_error', (error) => {
    console.error('Ulanish xatosi:', error.message);
});

socket.on('disconnect', (reason) => {
    console.log('Socket serverdan uzildi:', reason);
});

socket.on('error', (error) => {
    console.error('Socket xatosi:', error);
});

export default socket;