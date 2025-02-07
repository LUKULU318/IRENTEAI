import React, { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  Chip,
  Snackbar,
  Skeleton
} from "@mui/material";
import { InsertLink, ThumbUp, Comment, Share } from "@mui/icons-material";
import { gcpServices } from "./api";

const SocialMediaAnalysis = () => {
  const [user] = useAuthState(gcpServices.auth);
  const [url, setUrl] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return url.startsWith("http://") || url.startsWith("https://");
    } catch {
      return false;
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!isValidUrl(url)) {
      setError("Please enter a valid URL starting with http:// or https://");
      return;
    }

    setLoading(true);
    try {
      const response = await gcpServices.analyzeSocialContent(url);
      setAnalysis(response);
    } catch (err) {
      setError(err.message || "Failed to analyze the link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, margin: "0 auto", p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Analyze Social Content
      </Typography>

      <Box component="form" onSubmit={handleAnalyze} sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Social Media URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          error={!!error}
          helperText={error}
          InputProps={{
            startAdornment: <InsertLink sx={{ mr: 1, color: "action.active" }} />
          }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={!user || loading}
          sx={{ mt: 2 }}
          startIcon={loading ? <CircularProgress size={20} /> : <ThumbUp />}
        >
          {!user ? "Login Required" : loading ? "Analyzing..." : "Analyze Post"}
        </Button>
      </Box>

      {analysis && (
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Engagement Metrics
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <ThumbUp color="primary" />
                    <Typography variant="body1">
                      Likes: {analysis.metrics.likes.toLocaleString()}
                    </Typography>
                  </Box>
                </Paper>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Comment color="primary" />
                    <Typography variant="body1">
                      Comments: {analysis.metrics.comments.toLocaleString()}
                    </Typography>
                  </Box>
                </Paper>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Share color="primary" />
                    <Typography variant="body1">
                      Shares: {analysis.metrics.shares.toLocaleString()}
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Performance Analysis
              </Typography>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body1" gutterBottom>
                  Engagement Rate
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={analysis.engagementRate * 100}
                  sx={{ height: 10, mb: 2 }}
                  color={
                    analysis.engagementRate > 0.7 ? "success" :
                    analysis.engagementRate > 0.4 ? "warning" : "error"
                  }
                />
                <Chip
                  label={`${(analysis.engagementRate * 100).toFixed(1)}%`}
                  color="primary"
                  variant="outlined"
                />
              </Paper>

              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="body1" gutterBottom>
                  Sentiment Analysis
                </Typography>
                <Chip
                  label={analysis.sentiment.label}
                  color={
                    analysis.sentiment.label === "Positive" ? "success" :
                    analysis.sentiment.label === "Neutral" ? "warning" : "error"
                  }
                />
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Confidence: {(analysis.sentiment.confidence * 100).toFixed(1)}%
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      )}

      {loading && (
        <Box sx={{ mt: 4 }}>
          <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={100} />
        </Box>
      )}

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError("")}
        message={error}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      />
    </Box>
  );
};

export default SocialMediaAnalysis;