import React, { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Skeleton,
  Snackbar
} from "@mui/material";
import { Lightbulb, Videocam, Tag } from "@mui/icons-material";
import { gcpServices } from "./api";

const Recommendations = () => {
  const [user] = useAuthState(gcpServices.auth);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user) return;
      
      try {
        const data = await gcpServices.getRecommendations(user.uid);
        setRecommendations(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [user]);

  return (
    <Box sx={{ maxWidth: 800, margin: "0 auto", p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Creator Recommendations
      </Typography>

      {loading ? (
        [...Array(3)].map((_, index) => (
          <Skeleton key={index} variant="rectangular" height={80} sx={{ mb: 2 }} />
        ))
      ) : (
        <List>
          {recommendations.map((rec) => (
            <Card key={rec.id} sx={{ mb: 2 }}>
              <CardContent>
                <ListItem>
                  <ListItemIcon>
                    {rec.type === "video" ? <Videocam color="primary" /> : <Tag color="primary" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={rec.title}
                    secondary={rec.description}
                  />
                  <Chip
                    label={`${rec.effectiveness}% effective`}
                    color={
                      rec.effectiveness > 80 ? "success" :
                      rec.effectiveness > 60 ? "warning" : "error"
                    }
                    variant="outlined"
                  />
                </ListItem>
                {rec.example && (
                  <Typography variant="caption" color="text.secondary">
                    Example: "{rec.example}"
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
        </List>
      )}

      {error && (
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError("")}
          message={error}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        />
      )}

      {!loading && recommendations.length === 0 && (
        <Paper sx={{ p: 2, textAlign: "center" }}>
          <Lightbulb fontSize="large" color="action" />
          <Typography variant="body1" sx={{ mt: 1 }}>
            No recommendations found. Complete more analyses to get personalized suggestions!
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default Recommendations;