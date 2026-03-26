import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setAuthTokenGetter } from "@workspace/api-client-react";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "./components/Layout";
import RestaurantLayout from "./components/RestaurantLayout";

import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Restaurants from "./pages/Restaurants";
import Drivers from "./pages/Drivers";
import MenuItems from "./pages/MenuItems";
import Payments from "./pages/Payments";
import RestaurantRequests from "./pages/RestaurantRequests";

import RestaurantDashboard from "./pages/restaurant/RestaurantDashboard";
import RestaurantOrders from "./pages/restaurant/RestaurantOrders";
import RestaurantCustomers from "./pages/restaurant/RestaurantCustomers";
import RestaurantMenu from "./pages/restaurant/RestaurantMenu";

import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function AuthTokenSync() {
  const { token } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => token);
  }, [token]);
  return null;
}

function AdminRoutes() {
  const { user, isLoading, isAdmin } = useAuth();
  const redirecting = useRef(false);
  useEffect(() => {
    if (isLoading || redirecting.current) return;
    if (!user) { redirecting.current = true; window.location.href = "/delivery/login"; return; }
    if (!isAdmin) { redirecting.current = true; window.location.href = "/restaurant/dashboard"; }
  }, [isLoading, user, isAdmin]);
  if (isLoading || !user || !isAdmin) return null;

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/orders" component={Orders} />
        <Route path="/customers" component={Customers} />
        <Route path="/restaurants" component={Restaurants} />
        <Route path="/restaurant-requests" component={RestaurantRequests} />
        <Route path="/drivers" component={Drivers} />
        <Route path="/menu-items" component={MenuItems} />
        <Route path="/payments" component={Payments} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function RestaurantRoutes() {
  const { user, isLoading, isRestaurant } = useAuth();
  const redirecting = useRef(false);
  useEffect(() => {
    if (isLoading || redirecting.current) return;
    if (!user) { redirecting.current = true; window.location.href = "/delivery/login"; return; }
    if (!isRestaurant) { redirecting.current = true; window.location.href = "/"; }
  }, [isLoading, user, isRestaurant]);
  if (isLoading || !user || !isRestaurant) return null;

  return (
    <RestaurantLayout>
      <Switch>
        <Route path="/restaurant/dashboard" component={RestaurantDashboard} />
        <Route path="/restaurant/orders" component={RestaurantOrders} />
        <Route path="/restaurant/customers" component={RestaurantCustomers} />
        <Route path="/restaurant/menu" component={RestaurantMenu} />
        <Route component={NotFound} />
      </Switch>
    </RestaurantLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/restaurant/:rest*">
        {() => <RestaurantRoutes />}
      </Route>
      <Route>
        {() => <AdminRoutes />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthTokenSync />
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
