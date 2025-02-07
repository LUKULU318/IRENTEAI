// src/ErrorBoundary.js
import { ErrorBoundary } from "react-error-boundary";

const ErrorFallback = ({ error }) => (
  <Alert severity="error" sx={{ m: 2 }}>
    <Typography variant="h6">Something went wrong:</Typography>
    <Typography>{error.message}</Typography>
  </Alert>
);

// Wrap App component
<ErrorBoundary FallbackComponent={ErrorFallback}>
  <App />
</ErrorBoundary>