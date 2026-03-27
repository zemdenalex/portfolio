import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <SettingsForm />
    </div>
  );
}
