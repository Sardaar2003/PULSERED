import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

const getInitialToken = () => {
  const savedToken = localStorage.getItem('pulsered_token');
  if (savedToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
  }
  return savedToken;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getInitialToken);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'
  const [savedPosts, setSavedPosts] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [sessionEvicted, setSessionEvicted] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);

  // Intercept 401 concurrent session eviction errors globally
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data?.code === 'CONCURRENT_SESSION_TERMINATED') {
          setSessionEvicted(true);
          logout();
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Configure global Axios token header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`);
      setUser(response.data.user);
      fetchSavedPosts();
      fetchSearchHistory();
      if (response.data.user.role === 'admin') {
        fetchAdminUsers();
      }
    } catch (error) {
      console.error('Failed to restore user session:', error);
      if (error.response?.data?.code !== 'CONCURRENT_SESSION_TERMINATED') {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedPosts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/reddit/saved`);
      setSavedPosts(response.data.saved || []);
    } catch (error) {
      console.error('Failed to fetch saved posts:', error);
    }
  };

  const fetchSearchHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/reddit/history`);
      setSearchHistory(response.data.history || []);
    } catch (error) {
      console.error('Failed to fetch search history:', error);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/admin/users`);
      setAdminUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch admin users:', error);
    }
  };

  const approveUser = async (userId, approve = true) => {
    try {
      await axios.put(`${API_BASE_URL}/auth/admin/approve/${userId}`, { approve });
      fetchAdminUsers();
    } catch (error) {
      console.error('Failed to approve user:', error);
    }
  };

  const deleteUser = async (userId) => {
    try {
      await axios.delete(`${API_BASE_URL}/auth/admin/users/${userId}`);
      fetchAdminUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert(error.response?.data?.error || 'Failed to delete user account');
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('pulsered_token', newToken);
    setToken(newToken);
    setUser(userData);
    setIsAuthModalOpen(false);
    setSessionEvicted(false);
    return response.data;
  };

  const register = async (name, email, password) => {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, { name, email, password });
    
    if (response.data.requiresApproval) {
      return response.data;
    }

    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('pulsered_token', newToken);
    setToken(newToken);
    setUser(userData);
    setIsAuthModalOpen(false);
    setSessionEvicted(false);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('pulsered_token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setSavedPosts([]);
    setSearchHistory([]);
    setAdminUsers([]);
  };

  const updateProwloKey = async (prowloApiKey) => {
    const response = await axios.put(`${API_BASE_URL}/auth/settings`, { prowloApiKey });
    setUser(response.data.user);
    return response.data;
  };

  const toggleSavePost = async (post) => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    const isSaved = savedPosts.some((sp) => sp.postId === post.id);

    try {
      if (isSaved) {
        await axios.delete(`${API_BASE_URL}/reddit/saved/${post.id}`);
        setSavedPosts((prev) => prev.filter((sp) => sp.postId !== post.id));
      } else {
        const response = await axios.post(`${API_BASE_URL}/reddit/saved`, { post });
        setSavedPosts((prev) => [response.data.saved, ...prev]);
      }
    } catch (error) {
      console.error('Failed to update saved post:', error);
    }
  };

  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && user.isApproved,
        isAuthModalOpen,
        authModalMode,
        savedPosts,
        searchHistory,
        sessionEvicted,
        adminUsers,
        setSessionEvicted,
        login,
        register,
        logout,
        updateProwloKey,
        toggleSavePost,
        fetchSavedPosts,
        fetchSearchHistory,
        fetchAdminUsers,
        approveUser,
        deleteUser,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
