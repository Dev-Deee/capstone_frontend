"use client";

import { useEffect, useRef, useState } from "react";
import { userApi, authApi } from "@/lib/api";
import { registerBiometric } from "@/lib/webauthn";
import ActiveDevices from "@/components/ActiveDevices";
import PageHeader from "@/components/PageHeader";

type Tab = "info" | "phone" | "password" | "biometric" | "devices";

export default function StudentProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [profile, setProfile] = useState<any>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isChanging, setIsChanging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Phone OTP state
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  useEffect(() => {
    userApi.getMe().then(setProfile).catch(() => {});
  }, []);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setIsChanging(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setMessage({ type: "success", text: "Password changed. You'll need to sign in again on other devices." });
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to change password" });
    } finally {
      setIsChanging(false);
    }
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please choose an image file." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image must be under 5MB." });
      return;
    }

    setMessage(null);
    setIsUploading(true);
    try {
      const updated = await userApi.uploadProfileImage(file);
      setProfile(updated);
      setMessage({ type: "success", text: "Profile picture updated." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to upload image" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleEnableBiometric() {
    setIsEnrolling(true);
    try {
      await registerBiometric(navigator.userAgent);
      setMessage({ type: "success", text: "Biometric login enabled on this device." });
    } catch {
      setMessage({ type: "error", text: "Failed to enable biometric login. Your device may not support it." });
    } finally {
      setIsEnrolling(false);
    }
  }

  async function handleSendPhoneOtp() {
    setMessage(null);
    setIsSendingOtp(true);
    try {
      await authApi.sendPhoneOtp();
      setPhoneOtpSent(true);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to send verification code" });
    } finally {
      setIsSendingOtp(false);
    }
  }

  async function handleVerifyPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setIsVerifyingOtp(true);
    try {
      await authApi.verifyPhoneOtp(phoneOtpCode);
      setMessage({ type: "success", text: "Phone number verified." });
      setPhoneOtpCode("");
      // Refresh profile so the verified badge appears without a full reload
      userApi.getMe().then(setProfile).catch(() => {});
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Invalid or expired code" });
      // Leave phoneOtpSent = true so they can retry without re-entering phone
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  function initials(name: string | undefined) {
    if (!name) return "?";
    return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "info", label: "Profile" },
    { id: "phone", label: "Phone" },
    { id: "password", label: "Password" },
    { id: "biometric", label: "Biometric Login" },
    { id: "devices", label: "Devices" },
  ];

  return (
    <div className="p-6">
      <PageHeader title="Account Settings" description="Your profile, sign-in options and the devices signed in to your account." />

      {/* Same tab bar as the other tabbed pages */}
      <div className="flex gap-1 mb-6 overflow-x-auto overflow-y-hidden shadow-[inset_0_-1px_0_theme(colors.gray.200)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setMessage(null); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        <div className="max-w-lg">
          {message && (
            <div className={`text-sm rounded-lg px-3 py-2 border mb-4 ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border-green-100"
                : "bg-red-50 text-red-700 border-red-100"
            }`}>
              {message.text}
            </div>
          )}

          {activeTab === "info" && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-5">Profile Information</h2>

              {/* Avatar upload */}
              <div className="flex items-center gap-4 pb-5 mb-5 border-b border-gray-100">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-gray-200">
                  {profile?.profileImageUrl ? (
                    <img src={profile.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-500 text-base font-semibold">{initials(profile?.fullName)}</span>
                  )}
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelected}
                    className="hidden"
                    id="profile-image-input"
                  />
                  <label
                    htmlFor="profile-image-input"
                    className={`inline-block text-sm px-3 py-1.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 font-medium text-gray-700 ${
                      isUploading ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    {isUploading ? "Uploading…" : "Change photo"}
                  </label>
                  <p className="text-xs text-gray-400 mt-1">JPG or PNG, max 5 MB</p>
                </div>
              </div>

              {/* Details */}
              {profile ? (
                <dl className="space-y-4">
                  {[
                    { label: "Full Name", value: profile.fullName },
                    { label: "Email", value: profile.email },
                    { label: "Phone", value: profile.phoneNumber },
                    ...(profile.cohortName ? [{ label: "Cohort", value: profile.cohortName }] : []),
                    ...(profile.institutionStudentId ? [{ label: "Student ID", value: profile.institutionStudentId }] : []),
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</dt>
                      <dd className="text-sm text-gray-900">{value || "—"}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-gray-400">Loading…</p>
              )}

              <p className="text-xs text-gray-400 mt-6 pt-5 border-t border-gray-100">
                Contact an admin to update your name or email.
              </p>
            </div>
          )}

          {activeTab === "phone" && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-5">Phone Verification</h2>

              {profile?.phoneVerified ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-900">{profile.phoneNumber}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                    Verified
                  </span>
                </div>
              ) : !phoneOtpSent ? (
                <div>
                  <p className="text-sm text-gray-900 mb-4">{profile?.phoneNumber || "—"}</p>
                  <button
                    onClick={handleSendPhoneOtp}
                    disabled={isSendingOtp}
                    className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                  >
                    {isSendingOtp ? "Sending…" : "Send verification code"}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Enter the 6-digit code sent to <span className="font-medium text-gray-700">{profile?.phoneNumber}</span>.
                  </p>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={phoneOtpCode}
                    onChange={(e) => setPhoneOtpCode(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest text-center font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isVerifyingOtp}
                    className="w-full bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isVerifyingOtp ? "Verifying…" : "Verify"}
                  </button>
                </form>
              )}
            </div>
          )}

          {activeTab === "password" && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-5">Change Password</h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Current password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">New password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isChanging}
                  className="w-full bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isChanging ? "Updating…" : "Update Password"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "biometric" && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Biometric Login</h2>
              <p className="text-sm text-gray-500 mb-5">
                Use your device's fingerprint or Face ID to sign in faster. This is optional — you can always use your password instead.
              </p>
              <button
                onClick={handleEnableBiometric}
                disabled={isEnrolling}
                className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {isEnrolling ? "Enrolling…" : "Enable on this device"}
              </button>
            </div>
          )}

          {activeTab === "devices" && <ActiveDevices />}
        </div>
      </div>
    </div>
  );
}
