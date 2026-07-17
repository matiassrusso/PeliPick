import { Toaster } from "sonner";
import { Route, Switch } from "wouter";

import ErrorBoundary from "./components/ErrorBoundary";
import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";
import { AuthProvider } from "./hooks/useAuth";
import History from "./pages/History";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Recommend from "./pages/Recommend";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/recommend" component={Recommend} />
      <Route path="/history" component={History} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Toaster
          toastOptions={{
            style: {
              fontFamily: "var(--font-mono)",
              borderRadius: 0,
            },
          }}
        />
        <div className="min-h-screen flex flex-col bg-background text-foreground">
          <Navbar />
          <div className="flex-1">
            <Router />
          </div>
          <Footer />
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}
