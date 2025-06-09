"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { IconKey } from "@tabler/icons-react";

export function PasswordForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement actual password reset logic with tRPC
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      toast({
        title: "Password Reset Email Sent",
        description:
          "Check your email for instructions to reset your password.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send password reset email.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconKey className="w-5 h-5" />
          Password
        </CardTitle>
        <CardDescription>
          Reset your password by sending a reset link to your email.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Click the button below to receive a password reset email.
          </p>
        </div>
        <div>
          <Button
            onClick={handleResetPassword}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? "Sending..." : "Reset Password"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
