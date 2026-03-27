import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart";
import { ThemeProvider } from "@/hooks/use-theme";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";
import Register from "@/pages/register";
import Home from "@/pages/home";
import RestaurantDetail from "@/pages/restaurant";
import Cart from "@/pages/cart";
import Orders from "@/pages/orders";
import OrderDetail from "@/pages/order-detail";
import Profile from "@/pages/profile";
import { useEffect, useRef } from "react";

const queryClient = new QueryClient();

// Higher order component for protected routes
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAuth();
  const redirecting = useRef(false);

  useEffect(() => {
    if (!isAuthenticated && !redirecting.current) {
      redirecting.current = true;
      window.location.replace("/delivery/login");
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;
  return <Component />;
}

// Redirect if already logged in
function AuthRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAuth();
  const redirecting = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !redirecting.current) {
      redirecting.current = true;
      window.location.replace("/delivery/");
    }
  }, [isAuthenticated]);

  if (isAuthenticated) return null;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Public / Auth Routes */}
      <Route path="/login"><AuthRoute component={Login} /></Route>
      <Route path="/register"><AuthRoute component={Register} /></Route>

      {/* Protected Routes */}
      <Route path="/"><ProtectedRoute component={Home} /></Route>
      <Route path="/restaurant/:id"><ProtectedRoute component={RestaurantDetail} /></Route>
      <Route path="/cart"><ProtectedRoute component={Cart} /></Route>
      <Route path="/orders"><ProtectedRoute component={Orders} /></Route>
      <Route path="/orders/:id"><ProtectedRoute component={OrderDetail} /></Route>
      <Route path="/profile"><ProtectedRoute component={Profile} /></Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <CartProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <Toaster />
            </CartProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
