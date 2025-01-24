import axios from 'axios';

const api = axios.create({
    baseURL: 'https://barback.mixmall.uz', // Yangilandi
    timeout: 20000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: false // CORS uchun o'zgartirildi
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Token muammosi bo'lsa
            if (error.response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
            // CORS xatosi bo'lsa
            if (error.response.status === 403) {
                console.error('CORS error:', error.response);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
