"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, MailCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState<string>("");

  useEffect(() => {
    const oobCodeFromUrl = searchParams.get("oobCode");
    if (oobCodeFromUrl) {
      setVerificationCode(oobCodeFromUrl);
    }
  }, [searchParams]);

  const verifyEmailWithCode = async (code: string) => {
    if (!code) {
      setError("Please enter the verification code.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log("Verifying with code:", code);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSuccess("Email verified successfully! You can now sign in.");
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to verify email. The code might be invalid or expired."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    await verifyEmailWithCode(verificationCode);
  };

  const resendVerificationEmail = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess(
        "Verification email sent! Please check your inbox for a new code."
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send verification email"
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Alert>
            <MailCheck className="h-5 w-5 mr-2" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Redirecting you to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px] p-6 rounded-lg shadow-none">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Verify Your Email
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter the verification code sent to your email address.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleVerificationSubmit} className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="verificationCode">Verification Code</Label>
            <Input
              id="verificationCode"
              type="text"
              placeholder="e.g., 7AFIFYL2"
              value={verificationCode}
              onChange={(e) =>
                setVerificationCode(e.target.value.toUpperCase())
              }
              disabled={loading}
              required
              className="text-center text-lg tracking-wider"
              maxLength={8}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !verificationCode}
          >
            {loading ? "Verifying..." : "Verify Email"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          Didn't receive the code?{" "}
          <Button
            variant="link"
            onClick={resendVerificationEmail}
            disabled={loading}
            className="p-0 h-auto font-medium text-primary"
          >
            Resend verification email
          </Button>
        </div>
      </div>
    </div>
  );
}
