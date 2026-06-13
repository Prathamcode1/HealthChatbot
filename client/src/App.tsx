import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "@/pages/landing";
import Chat from "@/pages/chat";
import Appointments from "@/pages/appointments";
import NotFound from "@/pages/not-found";
import HeartPrediction from "@/pages/HeartPrediction";
import EHRPrediction from "@/pages/EHRPrediction";   // <-- new import
import TBPrediction from "@/pages/TBPrediction";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/chat" component={Chat} />
      <Route path="/heart-prediction" component={HeartPrediction} />
      <Route path="/ehr-prediction" component={EHRPrediction} />   {/* new route */}
      <Route path="/appointments" component={Appointments} />
      <Route path="/tb-prediction" component={TBPrediction} />
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