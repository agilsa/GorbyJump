import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
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
  // Check if user follows target account
  checkFollow: async (userId: string, targetUsername: string = "GORBY_JUMP") => {
    try {
      const response = await apiClient.post("/api/twitter/check-follow", {
        userId,
        targetUsername,
      });
      return response.data;
    } catch (error) {
      throw new Error("Failed to check follow status");
    }
  },

  checkRetweet: async (tweetId: string) => {
    try {
      const response = await apiClient.post("/api/twitter/check-retweet", {
        tweetId,
      });
      return response.data;
    } catch (error) {
      throw new Error("Failed to check retweet status");
    }
  },

  // Post a tweet
  postTweet: async (text: string) => {
    try {
      const response = await apiClient.post("/api/twitter/tweet", {
        text,
      });
      return response.data;
    } catch (error) {
      throw new Error("Failed to post tweet");
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await apiClient.get("/api/twitter/profile");
      return response.data;
    } catch (error) {
      throw new Error("Failed to get profile");
    }
  },

  // Logout
  logout: async () => {
    try {
      const response = await apiClient.post("/api/twitter/logout");
      return response.data;
    } catch (error) {
      throw new Error("Failed to logout");
    }
  },
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
