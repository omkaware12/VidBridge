const { google } = require("googleapis");
const Channel = require("../models/Channel");

module.exports.getYouTubeAnalytics = async (req, res) => {
  try {
    // 1️⃣ Find creator's connected YouTube channel
    const channel = await Channel.findOne({ userId: req.user._id });

    if (!channel || !channel.accessToken) {
      return res.status(401).json({ error: "YouTube not connected for this user" });
    }

    // 2️⃣ Initialize OAuth2 client with tokens from DB
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: channel.accessToken,
      refresh_token: channel.refreshToken,
    });

    // 3️⃣ Initialize APIs
    const youtube = google.youtube("v3");
    const analytics = google.youtubeAnalytics("v2");

    // 4️⃣ Fetch channel info
    const channelResponse = await youtube.channels.list({
      mine: true,
      part: "snippet,statistics,contentDetails",
      auth: oauth2Client,
    });

    const channelInfo = channelResponse.data.items[0];
    if (!channelInfo) {
      return res.status(404).json({ error: "Channel not found" });
    }

    const uploadsPlaylistId = channelInfo.contentDetails.relatedPlaylists.uploads;

    // 5️⃣ Fetch recent uploads
    const videosResponse = await youtube.playlistItems.list({
      playlistId: uploadsPlaylistId,
      part: "snippet,contentDetails",
      maxResults: 25,
      auth: oauth2Client,
    });

    const videoIds = videosResponse.data.items.map(
      (item) => item.contentDetails.videoId
    );

    // 6️⃣ Fetch per-video stats
    const statsResponse = await youtube.videos.list({
      id: videoIds.join(","),
      part: "snippet,statistics",
      auth: oauth2Client,
    });

    // 7️⃣ Fetch overall analytics
    const analyticsResponse = await analytics.reports.query({
      ids: "channel==MINE",
      startDate: "2025-09-06",
      endDate: "2025-10-03",
      metrics:
        "views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost",
      dimensions: "day",
      auth: oauth2Client,
    });

    // 8️⃣ Return structured data
    res.json({
      channelName: channelInfo.snippet.title,
      analytics: analyticsResponse.data,
      videos: statsResponse.data.items.map((video) => ({
        title: video.snippet.title,
        videoId: video.id,
        publishedAt: video.snippet.publishedAt,
        views: video.statistics.viewCount,
        likes: video.statistics.likeCount,
        comments: video.statistics.commentCount,
      })),
    });
  } catch (error) {
    console.error("YouTube Analytics Error:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};
