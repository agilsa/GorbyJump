import { Router } from "express";
import passport from "passport";
import axios from "axios";

const router = Router();

router.get("/twitter/url", (req, res) => {
  try {
    const authUrl = "https://twitter.com/i/oauth2/authorize";
    const params = new URLSearchParams({
      response_type: "code",
      client_id: process.env.TWITTER_CLIENT_ID as string,
      redirect_uri: process.env.TWITTER_CALLBACK_URL as string,
      scope: "tweet.read tweet.write users.read follows.read follows.write",
      state: "state",
      code_challenge: "challenge",
      code_challenge_method: "plain",
    });

    res.json({ authUrl: `${authUrl}?${params.toString()}` });
  } catch (error) {
    console.error("Error generating Twitter auth URL:", error);
    res.status(500).json({ error: "Failed to generate auth URL" });
  }
});

// Twitter OAuth login endpoint
router.get("/auth/twitter", passport.authenticate("twitter"));

// Twitter OAuth callback
router.get("/auth/twitter/callback", passport.authenticate("twitter", { failureRedirect: "/login" }), (req, res) => {
  // Successful authentication, redirect to frontend with user data
  const user = req.user as any;
  const userData = encodeURIComponent(
    JSON.stringify({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      token: user.token,
      tokenSecret: user.tokenSecret,
    })
  );

  res.redirect(`${process.env.FRONTEND_URL}?twitter_auth=${userData}`);
});

// Check if user follows our Twitter account
router.post("/api/twitter/check-follow", async (req, res) => {
  try {
    const { userId, targetUsername = "GORBY_JUMP" } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = req.user as any;

    // Get target user ID first
    const targetUserResponse = await axios.get(`https://api.twitter.com/2/users/by/username/${targetUsername}`, {
      headers: {
        Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
      },
    });

    const targetUserId = targetUserResponse.data.data.id;

    // Check if user follows target
    const followResponse = await axios.get(`https://api.twitter.com/2/users/${user.id}/following`, {
      headers: {
        Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
      },
      params: {
        "user.fields": "id,username",
        max_results: 1000,
      },
    });

    const isFollowing = followResponse.data.data?.some((followedUser: any) => followedUser.id === targetUserId);

    res.json({
      success: true,
      isFollowing,
      targetUserId,
      message: isFollowing ? "User is following" : "User is not following",
    });
  } catch (error: any) {
    console.error("Error checking follow status:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to check follow status",
      details: error.response?.data?.detail || error.message,
    });
  }
});

// Check if user retweeted specific tweet
router.post("/api/twitter/check-retweet", async (req, res) => {
  try {
    const { tweetId } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = req.user as any;

    // Get user's recent tweets to check for retweets
    const userTweetsResponse = await axios.get(`https://api.twitter.com/2/users/${user.id}/tweets`, {
      headers: {
        Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
      },
      params: {
        "tweet.fields": "referenced_tweets",
        max_results: 100,
      },
    });

    const hasRetweeted = userTweetsResponse.data.data?.some((tweet: any) => tweet.referenced_tweets?.some((ref: any) => ref.type === "retweeted" && ref.id === tweetId));

    res.json({
      success: true,
      hasRetweeted,
      message: hasRetweeted ? "User has retweeted" : "User has not retweeted",
    });
  } catch (error: any) {
    console.error("Error checking retweet status:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to check retweet status",
      details: error.response?.data?.detail || error.message,
    });
  }
});

// Create a tweet (for sharing tasks)
router.post("/api/twitter/tweet", async (req, res) => {
  try {
    const { text } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = req.user as any;

    // Using OAuth 1.0a for posting tweets
    const OAuth = require("oauth").OAuth;
    const oauth = new OAuth("https://api.twitter.com/oauth/request_token", "https://api.twitter.com/oauth/access_token", process.env.TWITTER_CONSUMER_KEY, process.env.TWITTER_CONSUMER_SECRET, "1.0A", null, "HMAC-SHA1");

    const postData = JSON.stringify({ text });

    oauth.post("https://api.twitter.com/2/tweets", user.token, user.tokenSecret, postData, "application/json", (error: any, data: any) => {
      if (error) {
        console.error("Tweet error:", error);
        return res.status(500).json({ error: "Failed to post tweet" });
      }

      const tweetData = JSON.parse(data);
      res.json({
        success: true,
        tweetId: tweetData.data.id,
        message: "Tweet posted successfully",
      });
    });
  } catch (error: any) {
    console.error("Error posting tweet:", error);
    res.status(500).json({
      error: "Failed to post tweet",
      details: error.message,
    });
  }
});

// Get user profile
router.get("/api/twitter/profile", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const user = req.user as any;
  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    authenticated: true,
  });
});

// Logout
router.post("/api/twitter/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.json({ success: true, message: "Logged out successfully" });
  });
});

export default router;
