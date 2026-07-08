import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { KeyRound, ShieldAlert, Lock, User, Check, Loader2 } from "lucide-react";
import { getSecuritySettings, sha256 } from "../lib/firebaseService";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (username: string) => void;
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [step, setStep] = useState<"access_key" | "credentials" | "authenticating">("access_key");
  const [accessKey, setAccessKey] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingText, setLoadingText] = useState("");

  const [accessKeyAttempts, setAccessKeyAttempts] = useState(0);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);

  // Check lockout
  useEffect(() => {
    if (lockoutTime) {
      const remaining = Math.max(0, Math.ceil((lockoutTime - Date.now()) / 1000));
      if (remaining === 0) {
        setLockoutTime(null);
        setAccessKeyAttempts(0);
        setLoginAttempts(0);
        setErrorMsg("");
      } else {
        const interval = setInterval(() => {
          const rem = Math.max(0, Math.ceil((lockoutTime - Date.now()) / 1000));
          if (rem === 0) {
            setLockoutTime(null);
            setAccessKeyAttempts(0);
            setLoginAttempts(0);
            setErrorMsg("");
            clearInterval(interval);
          } else {
            setErrorMsg(`Locked out due to failed attempts. Try again in ${rem}s`);
          }
        }, 1000);
        return () => clearInterval(interval);
      }
    }
  }, [lockoutTime]);

  const handleAccessKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTime) return;

    try {
      const hashedKey = await sha256(accessKey);
      const security = await getSecuritySettings();

      if (security && hashedKey === security.accessKeyHash) {
        setErrorMsg("");
        setStep("credentials");
        setAccessKey("");
      } else {
        const newAttempts = accessKeyAttempts + 1;
        setAccessKeyAttempts(newAttempts);
        if (newAttempts >= 5) {
          setLockoutTime(Date.now() + 10 * 60 * 1000); // 10 minutes lockout
          setErrorMsg("Access Denied. Too many failed attempts. Locked out for 10 minutes.");
        } else {
          setErrorMsg("Access Denied");
        }
      }
    } catch (err) {
      setErrorMsg("Access Denied");
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTime) return;

    setStep("authenticating");
    setLoadingText("Authenticating...");

    try {
      const security = await getSecuritySettings();
      const hashedPass = await sha256(password);

      setTimeout(async () => {
        if (
          security &&
          username === security.username &&
          hashedPass === security.passwordHash
        ) {
          setLoadingText("Loading Dashboard...");
          setTimeout(() => {
            onLoginSuccess(username);
            onClose();
            // Reset state
            setStep("access_key");
            setUsername("");
            setPassword("");
            setErrorMsg("");
          }, 1000);
        } else {
          const newAttempts = loginAttempts + 1;
          setLoginAttempts(newAttempts);
          setStep("credentials");
          if (newAttempts >= 5) {
            setLockoutTime(Date.now() + 10 * 60 * 1000);
            setErrorMsg("Access Denied. Too many login attempts. Locked out for 10 minutes.");
          } else {
            setErrorMsg("Invalid username or password.");
          }
        }
      }, 1000);
    } catch (err) {
      setStep("credentials");
      setErrorMsg("Authentication failed. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" id="login-modal-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
        id="login-modal-container"
      >
        {/* Step 1: Access Key layer */}
        {step === "access_key" && (
          <div className="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="bg-teal-50 p-3 rounded-full mb-3 text-teal-700">
                <KeyRound className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">Security Access Control</h3>
              <p className="text-sm text-gray-500 mt-1">Enter your secure Access Key to unlock the login window.</p>
            </div>

            <form onSubmit={handleAccessKeySubmit} className="space-y-4" id="access-key-form">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Access Key</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    disabled={!!lockoutTime}
                    required
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent text-sm bg-gray-50/50"
                    id="access-key-input"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium flex items-center gap-2" id="access-key-error">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium text-sm text-gray-600"
                  id="access-key-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!accessKey || !!lockoutTime}
                  className="flex-1 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg transition font-medium text-sm shadow-sm"
                  id="access-key-continue"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Username & Password */}
        {step === "credentials" && (
          <div className="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="bg-teal-50 p-3 rounded-full mb-3 text-teal-700">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">Admin Authentication</h3>
              <p className="text-sm text-gray-500 mt-1">Please enter your username and password.</p>
            </div>

            <form onSubmit={handleCredentialsSubmit} className="space-y-4" id="credentials-form">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Username</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Admin username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={!!lockoutTime}
                    required
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent text-sm bg-gray-50/50"
                    id="username-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={!!lockoutTime}
                    required
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent text-sm bg-gray-50/50"
                    id="password-input"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium flex items-center gap-2" id="credentials-error">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("access_key")}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium text-sm text-gray-600"
                  id="credentials-back"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!username || !password || !!lockoutTime}
                  className="flex-1 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg transition font-medium text-sm shadow-sm"
                  id="credentials-login-btn"
                >
                  Log In
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Loading transition */}
        {step === "authenticating" && (
          <div className="p-12 flex flex-col items-center justify-center text-center" id="authenticating-loader">
            <Loader2 className="w-12 h-12 text-teal-700 animate-spin mb-4" />
            <h3 className="text-lg font-bold text-gray-900">{loadingText}</h3>
            <p className="text-sm text-gray-400 mt-1">Please wait while the environment configures.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
