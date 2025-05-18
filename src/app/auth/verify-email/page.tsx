"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { applyActionCode, sendEmailVerification } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth-layout";
import { CheckCircle2, AlertCircle, MailCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { auth } from "@/lib/firebase";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const oobCode = searchParams.get("oobCode");

    const verifyEmail = async () => {
      if (!oobCode) {
        setLoading(false);
        return;
      }

      try {
        await applyActionCode(auth, oobCode);
        setSuccess("Email verified successfully! You can now sign in.");
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to verify email");
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) {
      setError("No user found. Please sign in again.");
      return;
    }

    try {
      await sendEmailVerification(auth.currentUser);
      setSuccess("Verification email sent! Please check your inbox.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send verification email"
      );
    }
  };

  if (loading) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Verifying your email...
            </h1>
            <p className="text-sm text-muted-foreground">
              Please wait while we verify your email address
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Verify your email
          </h1>
          <p className="text-sm text-muted-foreground">
            {!success
              ? "Please check your email for a verification link. If you haven't received the email, you can request a new one below."
              : "You can now close this page and sign in to your account."}
          </p>
        </div>

        {!success && (
          <Button onClick={resendVerificationEmail} className="w-full">
            Resend verification email
          </Button>
        )}
      </div>
    </div>
  );
}
