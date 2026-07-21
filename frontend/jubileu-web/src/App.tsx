import { BrowserRouter } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col bg-background">
          <Navbar />
          <main className="flex-1">
            <AppRoutes />
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
