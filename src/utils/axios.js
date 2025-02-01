import axios from 'axios';

const api = axios.create({
    baseURL: 'https://barback.mixmall.uz', // Local server
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
        console.log('Starting request:', {
            url: config.url,
            method: config.method,
            headers: config.headers
        });

        const token = localStorage.getItem('token');
        const adminData = JSON.parse(localStorage.getItem('adminData'));
        
        console.log('Auth check:', {
            token: token ? 'exists' : 'missing',
            adminData: adminData ? 'exists' : 'missing'
        });

        if (!token || !adminData) {
            console.error('Auth credentials missing');
            localStorage.removeItem('token');
            localStorage.removeItem('adminData');
            window.location.href = '/login';
            return Promise.reject('Authentication required');
        }

        // Token ni to'g'ri formatda qo'shish
        config.headers['Authorization'] = `Bearer ${token}`;
        
        console.log('Final request config:', {
            url: config.url,
            method: config.method,
            headers: {
                ...config.headers,
                Authorization: `Bearer ${token.substring(0, 20)}...`
            }
        });

        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        console.log('Response received:', {
            status: response.status,
            data: response.data,
            headers: response.headers
        });
        return response;
    },
    (error) => {
        console.error('Response error:', {
            message: error.message,
            response: {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                headers: error.response?.headers
            },
            request: {
                url: error.config?.url,
                method: error.config?.method,
                headers: error.config?.headers
            }
        });

        if (error.response?.status === 403) {
            console.log('403 error detected, redirecting to login');
            localStorage.removeItem('token');
            localStorage.removeItem('adminData');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
