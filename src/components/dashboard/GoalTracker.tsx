import { useState } from "react";
import { Target, Pencil, PartyPopper } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEarningsHistory } from "@/hooks/useEarningsHistory";
import { goalProgress, sumBetween } from "@/lib/earnings";
import { toast } from "sonner";

const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function GoalTracker() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: rows = [] } = useEarningsHistory();
  const { data: goal } = useQuery({
    queryKey: ["monthly-goal", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("monthly_goal").eq("id", user!.id).maybeSingle();
      return data?.monthly_goal ? Number(data.monthly_goal) : null;
    },
  });
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const earned = sumBetween(rows, start, end);
  const pct = goalProgress(earned, goal);
  const hit = !!goal && earned >= goal;

  const save = async () => {
    const n = Number(value);
    if (!n || n <= 0) return toast.error("Enter a goal above $0");
    const { error } = await supabase.from("profiles").update({ monthly_goal: n }).eq("id", user!.id);
    if (error) return toast.error("Couldn't save your goal");
    qc.invalidateQueries({ queryKey: ["monthly-goal"] });
    setEditing(false);
    toast.success("Goal saved");
  };

  return (
    <div className="glass p-6 rounded-xl h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Monthly Goal</h3>
        </div>
        {!editing && (
          <Button size="sm" variant="ghost" onClick={() => { setValue(goal ? String(goal) : ""); setEditing(true); }}>
            <Pencil className="w-4 h-4 mr-1" />{goal ? "Edit" : "Set goal"}
          </Button>
        )}
      </div>
      {editing ? (
        <div className="flex gap-2">
          <Input type="number" min="1" placeholder="e.g. 1000" value={value} onChange={(e) => setValue(e.target.value)} />
          <Button onClick={save}>Save</Button>
        </div>
      ) : goal ? (
        <>
          <p className="text-2xl font-bold mb-1">{fmt(earned)} <span className="text-sm font-normal text-muted-foreground">of {fmt(goal)}</span></p>
          <Progress value={pct} className="h-2 mb-2" />
          {hit ? (
            <p className="text-sm text-primary flex items-center gap-1"><PartyPopper className="w-4 h-4" /> Goal reached this month!</p>
          ) : (
            <p className="text-sm text-muted-foreground">{pct}% there · {fmt(goal - earned)} to go</p>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Set a monthly earnings goal to track your progress.</p>
      )}
    </div>
  );
}
