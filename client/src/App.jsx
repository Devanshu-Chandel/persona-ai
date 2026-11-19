import { Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import Home from "./pages/Home";
import ProtectedRoute from "./ProtectedRoute";
import ChatPage from "./pages/ChatPage";
import CreatePersona from "./pages/CreatePersona";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }/>
        <Route
        path="/chat/:id"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
            <Route
        path="/personas/new"
        element={
          <ProtectedRoute>
            <CreatePersona />
          </ProtectedRoute>
        }
      />
            <Route
        path="/chat/new/:personaId"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}