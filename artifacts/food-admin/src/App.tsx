import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setAuthTokenGetter } from "@workspace/api-client-react";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "./components/Layout";
import RestaurantLayout from "./components/RestaurantLayout";

import Login from "./pages/Login";

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
  if (isLoading) return null;
  if (!user) return <Redirect to="/login" />;
  if (!isAdmin) return <Redirect to="/restaurant/dashboard" />;

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
  if (isLoading) return null;
  if (!user) return <Redirect to="/login" />;
  if (!isRestaurant) return <Redirect to="/" />;

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

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) {
    return user.role === "admin"
      ? <Redirect to="/" />
      : <Redirect to="/restaurant/dashboard" />;
  }
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login">
        {() => <PublicRoute component={Login} />}
      </Route>
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
