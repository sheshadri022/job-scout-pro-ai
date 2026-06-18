import { 
  useGetProfile, 
  useUpsertProfile,
  getGetProfileQueryKey,
  ProfileInputWorkMode
} from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Save } from "lucide-react";
import { useEffect } from "react";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  preferredRoles: z.string(), // We'll handle conversion to/from array
  preferredLocations: z.string(),
  expectedSalaryMin: z.coerce.number().min(0).optional(),
  expectedSalaryMax: z.coerce.number().min(0).optional(),
  workMode: z.enum(["remote", "hybrid", "onsite"]),
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
        } 
      },
      {
        onSuccess: (updatedProfile) => {
          queryClient.setQueryData(getGetProfileQueryKey(), updatedProfile);
          toast.success("Settings saved successfully");
        },
        onError: () => toast.error("Failed to save settings"),
      }
    );
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading settings...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Career Preferences</h1>
        <p className="text-slate-500 mt-1">Configure your target roles to improve match scoring.</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>This information helps the AI understand what you are looking for.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="preferredRoles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Roles</FormLabel>
                      <FormControl>
                        <Input placeholder="Frontend Engineer, Full Stack Developer..." {...field} />
                      </FormControl>
                      <FormDescription>Comma separated</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="preferredLocations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Locations</FormLabel>
                      <FormControl>
                        <Input placeholder="San Francisco, New York, Remote..." {...field} />
                      </FormControl>
                      <FormDescription>Comma separated</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="expectedSalaryMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Salary (USD)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="100000" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="expectedSalaryMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Salary (USD)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="150000" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Mode</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="remote">Remote</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                          <SelectItem value="onsite">On-site</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={upsertProfile.isPending}>
                  {upsertProfile.isPending ? "Saving..." : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}