import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

const BRAND_SUGGESTIONS = [
  "Energybits",
  "Ketone IQ",
  "ShareASale",
  "Impact",
  "Athletic Greens",
  "Bluehost",
  "NordVPN",
  "Shopify",
];

export function QuickAddPayout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [amount, setAmount] = useState("");
  const [brandSource, setBrandSource] = useState("");
  const [category, setCategory] = useState("direct_brand");
  const [brandOpen, setBrandOpen] = useState(false);

  // Fetch custom brands
  const { data: customBrands } = useQuery({
    queryKey: ["custom-brands"],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("custom_brands" as any)
        .select("name")
        .eq("user_id", user.id)
        .order("name");
      if (error) throw error;
      return ((data as any[]) || []).map((b: any) => b.name as string);
    },
    enabled: !!user?.id,
  });

  // Merge and deduplicate brands (case-insensitive)
  const allBrands = (() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const b of [...BRAND_SUGGESTIONS, ...(customBrands || [])]) {
      const key = b.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(b);
      }
    }
    return result;
  })();

  const filteredBrands = allBrands.filter((b) =>
    b.toLowerCase().includes(brandSource.toLowerCase())
  );

  const exactMatch = allBrands.some(
    (b) => b.toLowerCase() === brandSource.trim().toLowerCase()
  );

  const resetForm = () => {
    setAmount("");
    setBrandSource("");
    setCategory("direct_brand");
  };

  const saveBrandIfNew = async (name: string) => {
    if (!user?.id) return;
    const trimmed = name.trim().slice(0, 100);
    if (!trimmed) return;
    // Case-insensitive check against known brands
    if (allBrands.some((b) => b.toLowerCase() === trimmed.toLowerCase())) return;
    await supabase.from("custom_brands" as any).insert({
      user_id: user.id,
      name: trimmed,
    } as any);
    queryClient.invalidateQueries({ queryKey: ["custom-brands"] });
  };

  const handleAddNewBrand = async () => {
    const trimmed = brandSource.trim().slice(0, 100);
    if (!trimmed || !user?.id) return;
    await supabase.from("custom_brands" as any).insert({
      user_id: user.id,
      name: trimmed,
    } as any);
    queryClient.invalidateQueries({ queryKey: ["custom-brands"] });
    setBrandSource(trimmed);
    setBrandOpen(false);
  };

  const handleSave = async () => {
    if (!user?.id || !amount || !brandSource) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid positive number.", variant: "destructive" });
      return;
    }
    const trimmedBrand = brandSource.trim().slice(0, 100);
    if (trimmedBrand.length === 0) {
      toast({ title: "Invalid brand", description: "Please enter a valid brand/source name.", variant: "destructive" });
      return;
    }

    setSaving(true);

    // Auto-save brand if new
    await saveBrandIfNew(trimmedBrand);

    const { error } = await supabase.from("payouts" as any).insert({
      user_id: user.id,
      amount: parsedAmount,
      brand_source: trimmedBrand,
      category,
    } as any);

    setSaving(false);

    if (error) {
      toast({ title: "Error saving payout", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Payout logged",
      description: `$${parsedAmount.toFixed(2)} from ${trimmedBrand} added successfully.`,
    });

    queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    queryClient.invalidateQueries({ queryKey: ["earnings-chart"] });

    resetForm();
    setOpen(false);
  };

  return (
    <>
      <Button variant="glass" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" />
        Add Payout
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="bg-card/95 backdrop-blur-xl border-border/50 flex flex-col">
          <SheetHeader>
            <SheetTitle className="text-foreground font-display">Quick-Add Payout</SheetTitle>
            <SheetDescription>Log a payout from any affiliate source.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-6 mt-6">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="payout-amount" className="text-muted-foreground text-xs uppercase tracking-wider">
                Amount
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-display text-muted-foreground">$</span>
                <Input
                  id="payout-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                  className="pl-10 h-14 text-2xl font-display bg-background/50 border-border/50 focus:border-primary"
                />
              </div>
            </div>

            {/* Brand/Source */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                Brand / Source
              </Label>
              <Popover open={brandOpen} onOpenChange={setBrandOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-start h-12 bg-background/50 border-border/50 text-left font-normal"
                  >
                    {brandSource || "Select or type a brand..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search brands..."
                      value={brandSource}
                      onValueChange={setBrandSource}
                    />
                    <CommandList>
                      <CommandGroup>
                        {filteredBrands.map((brand) => (
                          <CommandItem
                            key={brand}
                            value={brand}
                            onSelect={(val) => {
                              setBrandSource(val);
                              setBrandOpen(false);
                            }}
                          >
                            {brand}
                          </CommandItem>
                        ))}
                        {brandSource.trim().length > 0 && !exactMatch && (
                          <CommandItem
                            value={`__add__${brandSource.trim()}`}
                            onSelect={handleAddNewBrand}
                            className="text-primary"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add &ldquo;{brandSource.trim().slice(0, 100)}&rdquo; as a new brand
                          </CommandItem>
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                Category
              </Label>
              <ToggleGroup
                type="single"
                value={category}
                onValueChange={(val) => val && setCategory(val)}
                className="w-full grid grid-cols-2 gap-2"
              >
                <ToggleGroupItem
                  value="direct_brand"
                  className="h-11 rounded-lg data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  Direct Brand
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="network"
                  className="h-11 rounded-lg data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  Network
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {/* Save */}
          <Button
            variant="hero"
            size="lg"
            className="w-full mt-6"
            onClick={handleSave}
            disabled={saving || !amount || !brandSource}
          >
            {saving ? "Saving..." : "Save Payout"}
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
}
