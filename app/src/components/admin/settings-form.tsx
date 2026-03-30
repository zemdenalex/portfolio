"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Lock, User } from "lucide-react";

// ─── Main Settings ───────────────────────────────────

export function SettingsForm() {
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    api<{ name: string; email: string }>("/api/auth/me")
      .then(setProfile)
      .catch(() => {
        // Not authenticated or API error
      });
  }, []);

  return (
    <div className="space-y-6">
      <ProfileForm
        name={profile?.name ?? ""}
        email={profile?.email ?? ""}
      />
      <PasswordForm />
    </div>
  );
}

// ─── Profile Form ────────────────────────────────────

function ProfileForm({
  name: initialName,
  email,
}: {
  name: string;
  email: string;
}) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(initialName);
  const [saved, setSaved] = useState(false);

  // Update name when props load
  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  async function handleSave() {
    setLoading(true);
    try {
      await api("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify({ name }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="p-6 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="h-4 w-4 text-accent" />
          Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
        />
        <Input label="Email" value={email} disabled />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={loading || !name.trim()}
          >
            <Save className="h-3 w-3" /> Save
          </Button>
          {saved && (
            <span className="text-sm text-green-600">Saved</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Password Form ───────────────────────────────────

function PasswordForm() {
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleChange() {
    setError("");
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await api("/api/auth/password", {
        method: "PUT",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="p-6 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lock className="h-4 w-4 text-accent" />
          Change Password
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-4">
        <Input
          label="Current Password"
          type="password"
          value={currentPassword}
          onChange={(e) => {
            setCurrentPassword(e.target.value);
            setError("");
          }}
        />
        <Input
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setError("");
          }}
        />
        <Input
          label="Confirm New Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setError("");
          }}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && (
          <p className="text-sm text-green-600">
            Password changed successfully
          </p>
        )}
        <Button
          size="sm"
          onClick={handleChange}
          disabled={
            loading ||
            !currentPassword ||
            !newPassword ||
            !confirmPassword
          }
        >
          <Lock className="h-3 w-3" /> Change Password
        </Button>
      </CardContent>
    </Card>
  );
}
