import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_GCP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_GCP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const CLOUD_FUNCTIONS_REGION = process.env.REACT_APP_GCP_REGION;
const PROJECT_ID = process.env.REACT_APP_GCP_PROJECT_ID;

export const gcpServices = {
  // Unified Error Handler
  async _handleRequest(request) {
    try {
      const response = await request();
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API request failed');
      }
      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw new Error(error.message || 'Service unavailable');
    }
  },

  // RAG System
  async getRAGResults(query) {
    const idToken = await auth.currentUser.getIdToken();
    return this._handleRequest(() =>
      fetch(`https://${CLOUD_FUNCTIONS_REGION}-${PROJECT_ID}.cloudfunctions.net/ragQuery`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${idToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query })
      })
    );
  },

  // Social Media Analysis
  async analyzeSocialContent(url) {
    const idToken = await auth.currentUser.getIdToken();
    return this._handleRequest(() =>
      fetch(`https://${CLOUD_FUNCTIONS_REGION}-${PROJECT_ID}.cloudfunctions.net/analyzeSocialContent`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${idToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ url })
      })
    );
  },

  // Recommendations
  async getRecommendations() {
    const idToken = await auth.currentUser.getIdToken();
    return this._handleRequest(() =>
      fetch(`https://${CLOUD_FUNCTIONS_REGION}-${PROJECT_ID}.cloudfunctions.net/getRecommendations`, {
        headers: {
          "Authorization": `Bearer ${idToken}`
        }
      })
    );
  }
};