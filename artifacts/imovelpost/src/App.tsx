import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Properties from "@/pages/properties";
import PropertyNew from "@/pages/property-new";
import PropertyDetail from "@/pages/property-detail";
import Generate from "@/pages/generate";
import Posts from "@/pages/posts";
import PostDetail from "@/pages/post-detail";
import Analysis from "@/pages/analysis";
import Campaigns from "@/pages/campaigns";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/properties" component={Properties} />
        <Route path="/properties/new" component={PropertyNew} />
        <Route path="/properties/:id" component={PropertyDetail} />
        <Route path="/generate" component={Generate} />
        <Route path="/posts" component={Posts} />
        <Route path="/posts/:id" component={PostDetail} />
        <Route path="/analysis" component={Analysis} />
        <Route path="/campaigns" component={Campaigns} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
