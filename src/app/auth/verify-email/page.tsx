"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MailCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [success, setSuccess] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState<string>("");

  const verifyEmailMutation = api.emailVerification.verifyEmail.useMutation();

  const resendMutation =
    api.emailVerification.resendVerificationEmail.useMutation();

  const handleVerificationSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!verificationCode) {
      toast.error("Please enter the verification code.");
      return;
    }
    setSuccess(null);

    toast.promise(verifyEmailMutation.mutateAsync({ code: verificationCode }), {
      loading: "Verifying your code...",
      success: () => {
        setSuccess("Email verified successfully! You can now sign in.");
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
        return "Email verified successfully! Redirecting to login...";
      },
      error: (err: unknown) => {
        if (err instanceof Error) {
          return err.message;
        }
        return "Failed to verify email. The code might be invalid or expired.";
      },
    });
  };

  const resendVerificationEmail = () => {
    setSuccess(null);
    toast.promise(resendMutation.mutateAsync(), {
      loading: "Sending a new code...",
      success: "A new verification code has been sent to your email.",
      error: (err: unknown) => {
        if (err instanceof Error) {
          return err.message;
        }
        return "Failed to resend verification email.";
      },
    });
  };

  const loading = verifyEmailMutation.isPending || resendMutation.isPending;

  if (success) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <Alert>
            <MailCheck className="mr-2 h-5 w-5" />
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
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px] rounded-lg p-6 shadow-none">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Verify Your Email
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter the verification code sent to your email address.
          </p>
        </div>

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
            {verifyEmailMutation.isPending ? "Verifying..." : "Verify Email"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          Didn't receive the code?{" "}
          <Button
            variant="link"
            onClick={resendVerificationEmail}
            disabled={loading}
            className="h-auto p-0 font-medium text-primary"
          >
            {resendMutation.isPending
              ? "Sending..."
              : "Resend verification email"}
          </Button>
        </div>
      </div>
    </div>
  );
}
