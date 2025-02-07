import React, { useState, useEffect, useCallback } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Chip,
  Snackbar,
  IconButton,
  Skeleton
} from "@mui/material";
import { Search, Close, ExpandMore } from "@mui/icons-material";
import { gcpServices } from "./api";

const RAGSystem = () => {
  const [user] = useAuthState(gcpServices.auth);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Debounced Search Handler
  const debouncedSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      const response = await gcpServices.getRAGResults(searchQuery);
      
      const formattedResults = response.predictions.map(pred => ({
        id: pred.deploymentResourceId,
        content: pred.content,
        confidence: pred.confidence,
        source: pred.metadata.source,
        timestamp: pred.metadata.timestamp
      }));
      
      setResults(formattedResults);
      await gcpServices.saveSearchHistory(user.uid, searchQuery);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load Search History
  useEffect(() => {
    if (user) {
      gcpServices.getSearchHistory(user.uid)
        .then(history => setHistory(history))
        .catch(err => setError("Failed to load history"));
    }
  }, [user]);

  return (
    <div className="rag-container">
      {/* Search Section */}
      <div className="search-section">
        <TextField
          fullWidth
          variant="outlined"
          label="Ask about Tanzanian social trends"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            endAdornment: (
              <Button
                variant="contained"
                onClick={() => debouncedSearch(query)}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Search />}
              >
                {loading ? "Analyzing..." : "Search"}
              </Button>
            )
          }}
        />

        {/* Search History */}
        {history.length > 0 && (
          <div className="history-chips">
            {history.map((term, index) => (
              <Chip
                key={index}
                label={term}
                onClick={() => setQuery(term)}
                onDelete={() => /* Implement delete logic */}
                deleteIcon={<Close />}
              />
            ))}
          </div>
        )}
      </div>

      {/* Results Section */}
      <div className="results-section">
        {loading ? (
          [...Array(3)].map((_, index) => (
            <Skeleton key={index} variant="rectangular" height={100} />
          ))
        ) : results.map((result) => (
          <Accordion key={result.id}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1">
                {result.content.substring(0, 80)}...
              </Typography>
              <Chip
                label={`${(result.confidence * 100).toFixed(1)}% Confidence`}
                color={
                  result.confidence > 0.8 ? "success" : 
                  result.confidence > 0.5 ? "warning" : "error"
                }
                sx={{ ml: 2 }}
              />
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1">{result.content}</Typography>
              <div className="metadata">
                <Chip label={`Source: ${result.source}`} variant="outlined" />
                <Chip label={`Date: ${new Date(result.timestamp).toLocaleDateString()}`} />
              </div>
            </AccordionDetails>
          </Accordion>
        ))}
      </div>

      {/* Error Handling */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError("")}
        message={error}
        action={
          <IconButton
            size="small"
            color="inherit"
            onClick={() => setError("")}
          >
            <Close fontSize="small" />
          </IconButton>
        }
      />
    </div>
  );
};

export default RAGSystem;