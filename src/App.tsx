import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { Navbar } from "./components/common/Navbar";
import { Footer } from "./components/common/Footer";
import { LandingView } from "./views/LandingView";
import { TranslationsListView } from "./views/TranslationsListView";
import { TranslationDetailView } from "./views/TranslationDetailView";
import { RegisterView } from "./views/RegisterView";
import { MethodologyView } from "./views/MethodologyView";
import { EvidenceView } from "./views/EvidenceView";
import { WalletView } from "./views/WalletView";

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <WalletProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-[#FBFBFA] dark:bg-[#0F1215] text-[#111827] dark:text-[#F3F4F6] font-sans transition-colors duration-150">
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <Routes>
                <Route path="/" element={<LandingView />} />
                <Route path="/translations" element={<TranslationsListView />} />
                <Route path="/t/:id" element={<TranslationDetailView />} />
                <Route path="/register" element={<RegisterView />} />
                <Route path="/method" element={<MethodologyView />} />
                <Route path="/evidence" element={<EvidenceView />} />
                <Route path="/wallet" element={<WalletView />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </WalletProvider>
    </ErrorBoundary>
  );
};

export default App;
