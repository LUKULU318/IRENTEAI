// src/components/Auth.js
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { gcpServices } from "../api";

const Auth = () => (
  <Box sx={{ textAlign: 'center', mt: 8 }}>
    <Button
      variant="contained"
      onClick={() => signInWithPopup(gcpServices.auth, new GoogleAuthProvider())}
      startIcon={<Google />}
    >
      Sign In with Google
    </Button>
  </Box>
);