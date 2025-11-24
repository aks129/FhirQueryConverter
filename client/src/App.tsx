import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import FAQ from "@/pages/faq";
import Demo from "@/pages/demo";
import AI from "@/pages/ai";
import CQLFunctions from "@/pages/cql-functions";
import E2EDemo from "@/pages/e2e-demo";
import E2EConfig from "@/pages/e2e-config";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/faq" component={FAQ} />
      <Route path="/demo" component={Demo} />
      <Route path="/ai" component={AI} />
      <Route path="/cql-functions" component={CQLFunctions} />
      <Route path="/e2e-demo" component={E2EDemo} />
      <Route path="/e2e-config" component={E2EConfig} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
