import {
  useGetProfile,
  useUpsertProfile,
  getGetProfileQueryKey,
} from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Key, Target, Sliders } from "lucide-react";
import { useEffect } from "react";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  preferredRoles: z.string(),
  preferredLocations: z.string(),
  expectedSalaryMin: z.coerce.number().min(0).optional(),
  expectedSalaryMax: z.coerce.number().min(0).optional(),
  workMode: z.enum(["remote", "hybrid", "onsite"]),
  scoreThreshold: z.coerce.number().min(0).max(100).default(70),
  rapidApiKey: z.string().optional(),
});

export default function Settings() {
  const { data: profile, isLoading } = useGetProfile();
  const upsertProfile = useUpsertProfile();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      preferredRoles: "",
      preferredLocations: "",
      expectedSalaryMin: undefined,
      expectedSalaryMax: undefined,
      workMode: "remote",
      scoreThreshold: 70,
      rapidApiKey: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        fullName: profile.fullName || "",
        preferredRoles: profile.preferredRoles?.join(", ") || "",
        preferredLocations: profile.preferredLocations?.join(", ") || "",
        expectedSalaryMin: profile.expectedSalaryMin || undefined,
        expectedSalaryMax: profile.expectedSalaryMax || undefined,
        workMode: (profile.workMode as "remote" | "hybrid" | "onsite") || "remote",
        scoreThreshold: (profile as any).scoreThreshold ?? 70,
        rapidApiKey: (profile as any).rapidApiKey || "",
      });
    }
  }, [profile, form]);

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    upsertProfile.mutate(
      {
        data: {
          ...values,
          preferredRoles: values.preferredRoles.split(",").map(r => r.trim()).filter(Boolean),
          preferredLocations: values.preferredLocations.split(",").map(l => l.trim()).filter(Boolean),
        } as any,
      },
      {
        onSuccess: (updatedProfile) => {
          queryClient.setQueryData(getGetProfileQueryKey(), updatedProfile);
          toast.success("Settings saved");
        },
        onError: () => toast.error("Failed to save settings"),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 glass-card animate-pulse" />
        ))}
      </div>
    );
  }

  const threshold = form.watch("scoreThreshold");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-white/40 mt-1 text-sm">Configure your job search preferences and integrations.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

          {/* Profile */}
          <div className="glass-card p-5 space-y-5">
            <h2 className="text-white/70 font-semibold text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              Career Preferences
            </h2>

            <FormField control={form.control} name="fullName" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/60 text-xs uppercase tracking-wide">Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Jane Doe" {...field}
                    className="bg-white/5 border-white/12 text-white placeholder:text-white/25 focus:border-blue-500/50" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField control={form.control} name="preferredRoles" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/60 text-xs uppercase tracking-wide">Target Roles</FormLabel>
                  <FormControl>
                    <Input placeholder="Frontend Engineer, Full Stack..." {...field}
                      className="bg-white/5 border-white/12 text-white placeholder:text-white/25 focus:border-blue-500/50" />
                  </FormControl>
                  <FormDescription className="text-white/30 text-xs">Comma separated</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="preferredLocations" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/60 text-xs uppercase tracking-wide">Preferred Locations</FormLabel>
                  <FormControl>
                    <Input placeholder="Bangalore, Remote, Mumbai..." {...field}
                      className="bg-white/5 border-white/12 text-white placeholder:text-white/25 focus:border-blue-500/50" />
                  </FormControl>
                  <FormDescription className="text-white/30 text-xs">Comma separated</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <FormField control={form.control} name="expectedSalaryMin" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/60 text-xs uppercase tracking-wide">Min Salary (₹/yr)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1200000" {...field} value={field.value || ""}
                      className="bg-white/5 border-white/12 text-white placeholder:text-white/25 focus:border-blue-500/50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="expectedSalaryMax" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/60 text-xs uppercase tracking-wide">Max Salary (₹/yr)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="2000000" {...field} value={field.value || ""}
                      className="bg-white/5 border-white/12 text-white placeholder:text-white/25 focus:border-blue-500/50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="workMode" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/60 text-xs uppercase tracking-wide">Work Mode</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white/5 border-white/12 text-white focus:border-blue-500/50">
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="glass-card border-white/15 text-white">
                      <SelectItem value="remote" className="hover:bg-white/10 focus:bg-white/10">Remote</SelectItem>
                      <SelectItem value="hybrid" className="hover:bg-white/10 focus:bg-white/10">Hybrid</SelectItem>
                      <SelectItem value="onsite" className="hover:bg-white/10 focus:bg-white/10">On-site</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          {/* Job Discovery */}
          <div className="glass-card p-5 space-y-5">
            <h2 className="text-white/70 font-semibold text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              Job Discovery Settings
            </h2>

            <FormField control={form.control} name="scoreThreshold" render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-white/60 text-xs uppercase tracking-wide">Match Score Threshold</FormLabel>
                  <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${
                    threshold >= 70 ? "score-high" : threshold >= 40 ? "score-mid" : "score-low"
                  }`}>
                    {threshold}%
                  </span>
                </div>
                <FormControl>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    {...field}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, hsl(221 90% 60%) 0%, hsl(221 90% 60%) ${threshold}%, rgba(255,255,255,0.1) ${threshold}%, rgba(255,255,255,0.1) 100%)`
                    }}
                  />
                </FormControl>
                <FormDescription className="text-white/30 text-xs">
                  Only jobs scoring above {threshold}% will appear in your Discover review queue.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          {/* API Keys */}
          <div className="glass-card p-5 space-y-5 border-amber-500/15">
            <div>
              <h2 className="text-white/70 font-semibold text-sm flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                API Keys
              </h2>
              <p className="text-white/30 text-xs mt-1">
                Keys are stored securely in your account. Required for live job portal access.
              </p>
            </div>

            <FormField control={form.control} name="rapidApiKey" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/60 text-xs uppercase tracking-wide">
                  RapidAPI Key
                  <span className="ml-2 text-amber-400/70 normal-case font-normal">(JSearch — LinkedIn/Indeed/Glassdoor)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Get free key at rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch"
                    {...field}
                    value={field.value || ""}
                    className="bg-white/5 border-white/12 text-white placeholder:text-white/20 focus:border-amber-500/50 font-mono text-sm"
                  />
                </FormControl>
                <FormDescription className="text-white/30 text-xs">
                  Free tier: 200 requests/month. Sign up at{" "}
                  <a href="https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch" target="_blank" rel="noopener noreferrer"
                    className="text-blue-400 hover:underline">
                    rapidapi.com
                  </a>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={upsertProfile.isPending} className="btn-gradient px-6">
              {upsertProfile.isPending ? "Saving…" : (
                <><Save className="w-4 h-4 mr-2" /> Save Settings</>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
