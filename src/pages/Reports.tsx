import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileBarChart } from "lucide-react";

const Reports = () => {
  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <main className="flex-1 ml-64 p-8 flex items-center justify-center">
        <Card className="glass max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <FileBarChart className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Coming Monday — detailed performance reports and exportable data are on the way.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Reports;
