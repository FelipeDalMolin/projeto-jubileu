import { BrowserRouter } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            background: "#f8fafc",
          }}
        >
          <Navbar />
          <main
            style={{
              flex: 1,
              maxWidth: 1200,
              margin: "0 auto",
              width: "100%",
              padding: "12px 20px 32px",
            }}
          >
            <AppRoutes />
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
