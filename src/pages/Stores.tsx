import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store } from "lucide-react";

const Stores = () => {
  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <main className="flex-1 ml-64 p-8 flex items-center justify-center">
        <Card className="glass max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <Store className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Stores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Coming Monday — store analytics and merchant insights are on the way.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Stores;
