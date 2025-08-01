import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("🔴 API Request Error:", error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error("🔴 API Response Error:", error.response?.data || error.message);

    // Handle common errors
    if (error.response?.status === 401) {
      console.log("🔐 Authentication required");
      // Could redirect to login or show auth modal
    }

    return Promise.reject(error);
  }
);

export const twitterAPI = {
  checkRetweet: (tweetId: string) => axios.post(`${API_URL}/api/twitter/check-retweet`, { tweetId }, { withCredentials: true }),

  checkFollow: (userId: string, targetUsername: string) => axios.post(`${API_URL}/api/twitter/check-follow`, { userId, targetUsername }, { withCredentials: true }),

  tweet: (text: string) => axios.post(`${API_URL}/api/twitter/tweet`, { text }, { withCredentials: true }),
};

// Health check function
export const healthCheck = async () => {
  try {
    const response = await apiClient.get("/api/health");
    return response.data;
  } catch (error) {
    throw new Error("Server is not responding");
  }
};

export default apiClient;
