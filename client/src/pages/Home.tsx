import React, { useState, useEffect } from "react";
import { useWallet } from "../contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gamepad, Trophy, Coins, Star, Gift, Timer, X, Volume2, VolumeX, Loader2, Twitter, CheckCircle, AlertCircle, User, Wifi, WifiOff } from "lucide-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { twitterAPI, healthCheck } from "@/services/api";

const Home = () => {
  const { walletAddress, disconnectWallet, connection, publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<"game" | "leaderboard">("game");
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [solBalance, setSolBalance] = useState<number>(0);
  const [loadingTasks, setLoadingTasks] = useState<{ [key: number]: boolean }>({});
  const [twitterUser, setTwitterUser] = useState<any>(null);
  const [taskStatus, setTaskStatus] = useState<{ [key: string]: boolean }>({});
  const [connectingTwitter, setConnectingTwitter] = useState(false);
  const [serverStatus, setServerStatus] = useState<"connected" | "disconnected" | "checking">("checking");
  const navigate = useNavigate();

  // Check server connection
  useEffect(() => {
    const checkServerConnection = async () => {
      try {
        await healthCheck();
        setServerStatus("connected");
        console.log("✅ Server connection established");
      } catch (error) {
        setServerStatus("disconnected");
        console.error("❌ Server connection failed:", error);
      }
    };

    checkServerConnection();

    // Check every 30 seconds
    const interval = setInterval(checkServerConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch SOL balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (publicKey && connection) {
        try {
          const balance = await connection.getBalance(publicKey);
          setSolBalance(balance / LAMPORTS_PER_SOL);
        } catch (error) {
          console.error("Error fetching balance:", error);
          setSolBalance(0);
        }
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [publicKey, connection]);

  // Handle Twitter auth callback and load saved user
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const twitterAuth = urlParams.get("twitter_auth");

    if (twitterAuth) {
      try {
        const userData = JSON.parse(decodeURIComponent(twitterAuth));
        setTwitterUser(userData);
        localStorage.setItem("twitter_user", JSON.stringify(userData));

        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);

        // Show success message
        console.log("Twitter connected successfully:", userData.username);
      } catch (error) {
        console.error("Error parsing Twitter auth data:", error);
      }
    } else {
      // Check if user data exists in localStorage
      const savedUser = localStorage.getItem("twitter_user");
      if (savedUser) {
        try {
          setTwitterUser(JSON.parse(savedUser));
        } catch (error) {
          console.error("Error parsing saved Twitter user:", error);
          localStorage.removeItem("twitter_user");
        }
      }
    }
  }, []);

  // Load completed tasks from localStorage
  useEffect(() => {
    const savedTaskStatus = localStorage.getItem("task_status");
    if (savedTaskStatus) {
      try {
        setTaskStatus(JSON.parse(savedTaskStatus));
      } catch (error) {
        console.error("Error parsing saved task status:", error);
      }
    }
  }, []);

  const toggleSound = () => {
    setIsSoundOn(!isSoundOn);
    console.log("Sound toggled:", !isSoundOn ? "ON" : "OFF");
  };

  // Twitter authentication function
  const handleTwitterAuth = async () => {
    if (serverStatus !== "connected") {
      alert("Server is not connected. Please try again later.");
      return;
    }

    try {
      setConnectingTwitter(true);
      // Get auth URL from backend
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/auth/twitter/url`);
      if (response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (error) {
      console.error("Failed to get Twitter auth URL:", error);
      setConnectingTwitter(false);
      alert("Failed to connect to Twitter. Please try again.");
    }
  };

  // Disconnect Twitter
  const handleTwitterDisconnect = async () => {
    try {
      await twitterAPI.logout();
      localStorage.removeItem("twitter_user");
      setTwitterUser(null);
      setTaskStatus({});
      localStorage.removeItem("task_status");
      console.log("✅ Twitter disconnected");
    } catch (error) {
      console.error("❌ Error disconnecting Twitter:", error);
      // Still remove local data even if server request fails
      localStorage.removeItem("twitter_user");
      setTwitterUser(null);
    }
  };

  const leaderboardData = [
    { rank: 1, name: "CryptoKing", score: 15420, reward: "500 GORBY" },
    { rank: 2, name: "BlockMaster", score: 14890, reward: "300 GORBY" },
    { rank: 3, name: "SolanaFan", score: 13750, reward: "200 GORBY" },
    { rank: 4, name: "GameProX", score: 12100, reward: "100 GORBY" },
    { rank: 5, name: "PixelHero", score: 11550, reward: "50 GORBY" },
  ];

  const tasks = [
    {
      title: "Follow Twitter",
      reward: "+1000",
      status: taskStatus["Follow Twitter"] ? "completed" : "available",
      icon: "🐦",
      description: "Follow our official Twitter account",
      link: "https://twitter.com/intent/follow?screen_name=JumpGorby",
      requiresAuth: true,
    },
    {
      title: "Retweet",
      reward: "+500",
      status: taskStatus["Retweet"] ? "completed" : "available",
      icon: "🔄",
      description: "Retweet our latest announcement",
      link: "https://twitter.com/intent/retweet?tweet_id=1940748103008899446",
      requiresAuth: true,
    },
    {
      title: "Join Discord",
      reward: "+2000",
      status: taskStatus["Join Discord"] ? "completed" : "available",
      icon: "💬",
      description: "Join our Discord community",
      link: "https://discord.gg/GORBY-JUMP",
      requiresAuth: false,
    },
    {
      title: "Daily Login",
      reward: "+250",
      status: taskStatus["Daily Login"] ? "completed" : "available",
      icon: "📅",
      description: "Login daily to earn bonus GORBY",
      link: null,
      requiresAuth: false,
    },
    {
      title: "Share Game",
      reward: "+750",
      status: taskStatus["Share Game"] ? "completed" : "available",
      icon: "📤",
      description: "Share the game with friends",
      link: null,
      requiresAuth: true,
    },
  ];

  const handleStartGame = () => {
    navigate("/game");
  };

  const saveTaskCompletion = (taskTitle: string) => {
    const newTaskStatus = { ...taskStatus, [taskTitle]: true };
    setTaskStatus(newTaskStatus);
    localStorage.setItem("task_status", JSON.stringify(newTaskStatus));
  };

  const handleTaskClick = async (taskIndex: number, link: string | null) => {
    const task = tasks[taskIndex];

    // Check if task requires Twitter auth
    if (task.requiresAuth && !twitterUser) {
      handleTwitterAuth();
      return;
    }

    // Don't allow completing already completed tasks
    if (task.status === "completed") {
      return;
    }

    setLoadingTasks((prev) => ({ ...prev, [taskIndex]: true }));

    try {
      switch (task.title) {
        case "Follow Twitter":
          if (link) {
            window.open(link, "_blank");

            // Wait a bit then check if user followed
            setTimeout(async () => {
              try {
                const response = await axios.post(
                  "http://localhost:5000/api/twitter/check-follow",
                  {
                    userId: twitterUser.id,
                    targetUsername: "JumpGorby",
                  },
                  { withCredentials: true }
                );

                if (response.data.isFollowing) {
                  saveTaskCompletion(task.title);
                  console.log("Follow task completed!");
                }
              } catch (error) {
                console.error("Error checking follow status:", error);
              }
              setLoadingTasks((prev) => ({ ...prev, [taskIndex]: false }));
            }, 5000);
          }
          break;

        case "Retweet":
          if (link) {
            window.open(link, "_blank");

            setTimeout(async () => {
              try {
                const response = await axios.post(
                  "http://localhost:5000/api/twitter/check-retweet",
                  {
                    tweetId: "https://twitter.com/intent/retweet?tweet_id=1940748103008899446",
                  },
                  { withCredentials: true }
                );

                if (response.data.hasRetweeted) {
                  saveTaskCompletion(task.title);
                  console.log("Retweet task completed!");
                }
              } catch (error) {
                console.error("Error checking retweet status:", error);
              }
              setLoadingTasks((prev) => ({ ...prev, [taskIndex]: false }));
            }, 5000);
          }
          break;

        case "Share Game":
          try {
            const shareText = "Playing GORBY Jump and earning $GORBY! Join me in this amazing Web3 game! 🎮🚀";
            const response = await axios.post(
              "http://localhost:5000/api/twitter/tweet",
              {
                text: shareText,
              },
              { withCredentials: true }
            );

            if (response.data.success) {
              saveTaskCompletion(task.title);
              console.log("Share task completed!");
            }
          } catch (error) {
            console.error("Error posting tweet:", error);
          }
          setLoadingTasks((prev) => ({ ...prev, [taskIndex]: false }));
          break;

        case "Daily Login":
          // Simulate daily login check
          setTimeout(() => {
            saveTaskCompletion(task.title);
            setLoadingTasks((prev) => ({ ...prev, [taskIndex]: false }));
          }, 1000);
          break;

        case "Join Discord":
          if (link) {
            window.open(link, "_blank");
            // Simulate completion after opening link
            setTimeout(() => {
              saveTaskCompletion(task.title);
              setLoadingTasks((prev) => ({ ...prev, [taskIndex]: false }));
            }, 3000);
          }
          break;

        default:
          if (link) {
            window.open(link, "_blank");
          }
          setTimeout(() => {
            setLoadingTasks((prev) => ({ ...prev, [taskIndex]: false }));
          }, 3000);
      }
    } catch (error) {
      console.error("Error handling task:", error);
      setLoadingTasks((prev) => ({ ...prev, [taskIndex]: false }));
    }
  };

  const getTaskButtonText = (task: any, taskIndex: number) => {
    if (loadingTasks[taskIndex]) {
      return <Loader2 className="animate-spin" size={16} />;
    }
    if (task.status === "completed") {
      return <CheckCircle size={16} className="text-green-500" />;
    }
    if (task.requiresAuth && !twitterUser) {
      return "Connect Twitter";
    }
    return "Claim";
  };

  const isTaskDisabled = (task: any, taskIndex: number) => {
    return loadingTasks[taskIndex] || task.status === "completed";
  };

  return (
    <div className="game-background min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white/90 shadow-xl rounded-xl p-6">
        {/* Header with wallet info and sound toggle */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm">
            {serverStatus === "connected" ? (
              <>
                <Wifi size={16} className="text-green-500" />
                <span className="text-green-600">Server Connected</span>
              </>
            ) : serverStatus === "disconnected" ? (
              <>
                <WifiOff size={16} className="text-red-500" />
                <span className="text-red-600">Server Disconnected</span>
              </>
            ) : (
              <>
                <Loader2 size={16} className="animate-spin text-yellow-500" />
                <span className="text-yellow-600">Checking Connection...</span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Coins className="text-yellow-500" size={24} />
            <span className="font-semibold">{solBalance.toFixed(3)} SOL</span>
            <Badge variant="secondary" className="ml-2">
              {walletAddress ? walletAddress.slice(0, 4) + "..." + walletAddress.slice(-4) : "No Wallet"}
            </Badge>
            {walletAddress && (
              <Button size="sm" variant="outline" className="ml-2" onClick={disconnectWallet}>
                Disconnect
              </Button>
            )}
          </div>
          <Button size="icon" variant="ghost" onClick={toggleSound} aria-label="Toggle Sound">
            {isSoundOn ? <Volume2 className="text-green-500" /> : <VolumeX className="text-gray-400" />}
          </Button>
        </div>

        {/* Twitter User Info Display */}
        {twitterUser ? (
          <Card className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                  <Twitter size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">@{twitterUser.username}</span>
                    <CheckCircle size={16} className="text-green-500" />
                  </div>
                  <div className="text-sm text-gray-600">{twitterUser.displayName}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-blue-500">
                  Connected
                </Badge>
                <Button size="sm" variant="outline" onClick={handleTwitterDisconnect} className="text-gray-600 hover:text-red-600">
                  <X size={14} className="mr-1" />
                  Disconnect
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white">
                  <User size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-600">Twitter Not Connected</span>
                    <AlertCircle size={16} className="text-orange-500" />
                  </div>
                  <div className="text-sm text-gray-500">Connect to complete social tasks</div>
                </div>
              </div>
              <Button onClick={handleTwitterAuth} disabled={connectingTwitter} className="bg-blue-500 hover:bg-blue-600 text-white">
                {connectingTwitter ? <Loader2 className="animate-spin mr-2" size={16} /> : <Twitter className="mr-2" size={16} />}
                Connect Twitter
              </Button>
            </div>
          </Card>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <Button variant={activeTab === "game" ? "default" : "outline"} onClick={() => setActiveTab("game")}>
            <Gamepad className="mr-2" size={18} /> Game
          </Button>
          <Button variant={activeTab === "leaderboard" ? "default" : "outline"} onClick={() => setActiveTab("leaderboard")}>
            <Trophy className="mr-2" size={18} /> Leaderboard
          </Button>
        </div>

        {/* Content */}
        {activeTab === "game" ? (
          <div className="flex flex-col gap-6">
            <Button size="lg" className="w-full bg-gradient-to-r from-yellow-400 to-pink-500 text-white text-xl font-bold shadow-lg hover:shadow-xl transition-shadow" onClick={handleStartGame}>
              <Gamepad className="mr-2" size={24} /> Start GORBY Jump
            </Button>

            <div>
              <h3 className="font-semibold mb-4 flex items-center">
                <Gift className="mr-2 text-pink-500" /> Daily & Social Tasks
              </h3>
              <div className="grid gap-3">
                {tasks.map((task, idx) => (
                  <Card key={task.title} className={`flex items-center justify-between p-4 transition-all ${task.status === "completed" ? "bg-green-50 border-green-200" : "bg-gray-50 hover:bg-gray-100"}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{task.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{task.title}</span>
                          {task.requiresAuth && !twitterUser && (
                            <Badge variant="outline" className="text-xs">
                              Requires Twitter
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{task.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={task.status === "completed" ? "default" : "secondary"} className={task.status === "completed" ? "bg-green-500" : ""}>
                        {task.reward}
                      </Badge>
                      <Button size="sm" disabled={isTaskDisabled(task, idx)} onClick={() => handleTaskClick(idx, task.link)} className={task.status === "completed" ? "bg-green-500 hover:bg-green-600" : ""}>
                        {getTaskButtonText(task, idx)}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Task completion stats */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-700">
                  <strong>Progress:</strong> {Object.values(taskStatus).filter(Boolean).length}/{tasks.length} tasks completed
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="font-semibold mb-4 flex items-center">
              <Trophy className="mr-2 text-yellow-500" /> Leaderboard
            </h3>
            <div className="grid gap-2">
              {leaderboardData.map((entry) => (
                <Card key={entry.rank} className="flex items-center justify-between p-3 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">#{entry.rank}</Badge>
                    <span className="font-medium">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="text-yellow-400" size={18} />
                    <span className="font-bold">{entry.score}</span>
                    <Badge variant="default">{entry.reward}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Home;
