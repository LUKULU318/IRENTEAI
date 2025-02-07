import React from "react";
import RAGSystem from "./RAGSystem"; // Adjust path as needed
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
import { CssBaseline, Container } from "@mui/material";

function App() {
  return (
    <React.Fragment>
      <CssBaseline /> {/* Resets default browser styles */}
      <Container maxWidth="lg">
        <RAGSystem /> {/* Your main component */}
      </Container>
    </React.Fragment>
  );
}

export default App;
