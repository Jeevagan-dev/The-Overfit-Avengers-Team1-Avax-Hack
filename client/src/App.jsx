import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import UploadPage from "./pages/ModelUploader";
import useWallet from "./hooks/useWallet";
import MarketplacePage from "./pages/MarketPlace";
import UserAPIKeyPanel from "./pages/ApiKeyGeneration";
import DownloadModel from "./pages/Download";
import { WalletProvider } from "./context/WalletProvider";
import Dashboard from "./pages/DashBoard";
import TrainingWithHistory from "./pages/TrainingWithHistory";
import "./index.css";
import Verify from './pages/Verify'
import Landing from "./pages/Landing";
import Footer from "./pages/Footer";
import ProofVerifier from "./pages/Verify";

export default function App() {

  return (
    <WalletProvider >
  

    <Router>
      <Navbar  />
      <Routes>
        <Route
          path="/"
          element={<Landing  />}
        />
         <Route
          path="/dashboard"
          element={<Dashboard />}
        />
        <Route
          path="/upload"
          element={<UploadPage  />}
        />
        <Route
          path="/marketplace"
          element={<MarketplacePage />}
        />
        <Route
          path="/api-keys"
          element={<UserAPIKeyPanel  />}
        />
        <Route path='/train' element={<TrainingWithHistory />} />
        <Route path='/download' element={<DownloadModel />} />
        <Route path="/verify" element={<Verify />} />
      </Routes>
      <Footer />
    </Router>
    </WalletProvider>
  );
}
