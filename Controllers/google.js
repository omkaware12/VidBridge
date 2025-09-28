const { google } = require("googleapis");
const Channel = require("../models/Channel");

// Setup OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Step 1: Redirect to Google Consent Screen
const jwt = require("jsonwebtoken");

module.exports.googleLogin = (req, res) => {
  // Get token from query parameter instead of headers
  const token = req.query.token;
  console.log("Token received:", token);
  
  if (!token) {
    return res.status(400).json({ error: "Token required" });
  }

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Store user info for callback (you'll need session support)
    // For now, let's use a simple approach with state parameter
    const userState = Buffer.from(JSON.stringify({ 
      userId: decoded._id 
    })).toString('base64');

    const scopes = [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: scopes,
      state: userState, // Pass user info through state parameter
    });

    res.redirect(url);
  } catch (err) {
    console.error("Token verification failed:", err);
    return res.redirect(`http://localhost:5173/dashboard?error=invalid_token`);
  }
};

// Step 2: Handle Google Callback
module.exports.googleCallback = async (req, res) => {
  try {
    const code = req.query.code;
    const state = req.query.state;

    if (!code || !state) {
      return res.redirect(`http://localhost:5173/dashboard?error=oauth_failed`);
    }

    const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
    const userId = decodedState.userId;
    const redirectTo = decodedState.redirectTo || '/creator-dashboard';

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const youtube = google.youtube("v3");
    const response = await youtube.channels.list({
      auth: oauth2Client,
      mine: true,
      part: "id,snippet,statistics",
    });

    if (!response.data.items || response.data.items.length === 0) {
      return res.redirect(`http://localhost:5173${redirectTo}?error=no_channel`);
    }

    const channelData = response.data.items[0];
    let channel = await Channel.findOne({ userId });
    if (!channel) {
      channel = new Channel({
        userId,
        channelId: channelData.id,
        channelName: channelData.snippet.title,
        subscribeCount: channelData.statistics.subscriberCount,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      });
    } else {
      channel.accessToken = tokens.access_token;
      if (tokens.refresh_token) channel.refreshToken = tokens.refresh_token;
      channel.channelName = channelData.snippet.title;
      channel.subscribeCount = channelData.statistics.subscriberCount;
    }

    await channel.save();

    // ✅ Redirect to dynamic path (creator dashboard)
    res.redirect(`http://localhost:5173${redirectTo}`);
  } catch (err) {
    console.error("Google Callback Error:", err);
    res.redirect(`http://localhost:5173/dashboard?error=oauth_failed`);
  }
};


module.exports.googleStatus = async (req, res) => {
  try {
    const userId = req.user._id; // from authenticate middleware
    const channel = await Channel.findOne({ userId });

    if (!channel) {
      return res.json({ connected: false });
    }

    res.json({
      connected: true,
      channelName: channel.channelName,
      subscribeCount: channel.subscribeCount
    });
  } catch (err) {
    console.error("Error checking status:", err);
    res.status(500).json({ connected: false, error: "Server error" });
  }
};

module.exports.googleDisconnect = async (req, res) => {
  try {
    const userId = req.user._id;

    const channel = await Channel.findOne({ userId });
    if (!channel) {
      return res.json({ success: false, message: "No channel found" });
    }

    await Channel.deleteOne({ userId });

    res.json({ success: true, message: "Disconnected successfully" });
  } catch (err) {
    console.error("Error disconnecting:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};