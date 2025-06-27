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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  IconShield,
  IconKey,
  IconDevices,
  IconCopy,
  IconCheck,
} from "@tabler/icons-react";

export function TwoFactorForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [recoveryCode] = useState("KIRS5MNEOZP7KXL4");
  const [isCopied, setIsCopied] = useState(false);

  const handleUpdateTOTP = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement actual TOTP update logic with tRPC
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: "Success",
        description: "TOTP has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update TOTP.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectTOTP = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement actual disconnect logic with tRPC
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: "Success",
        description: "Authenticator app has been disconnected.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect authenticator app.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPasskey = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement actual passkey registration logic with tRPC
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: "Success",
        description: "Passkey has been added.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add passkey.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSecurityKey = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement actual security key registration logic with tRPC
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: "Success",
        description: "Security key has been added.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add security key.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateNewCode = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement actual recovery code generation logic with tRPC
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: "Success",
        description: "New recovery code has been generated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate new recovery code.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyRecoveryCode = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCode);
      setIsCopied(true);
      toast({
        title: "Copied!",
        description: "Recovery code copied to clipboard.",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy recovery code.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Secure your account with two-factor authentication methods.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <IconShield className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium">Authenticator app</div>
                      <div className="text-xs text-muted-foreground">
                        TOTP authentication
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    Connected
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUpdateTOTP}
                      disabled={isLoading}
                      className="text-xs h-7"
                    >
                      Update
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDisconnectTOTP}
                      disabled={isLoading}
                      className="text-xs h-7"
                    >
                      Disconnect
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <IconDevices className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium">Passkeys</div>
                      <div className="text-xs text-muted-foreground">
                        WebAuthn device credentials
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    Not configured
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddPasskey}
                    disabled={isLoading}
                    className="text-xs h-7"
                  >
                    Add
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <IconKey className="h-4 w-4 text-orange-600" />
                    <div>
                      <div className="font-medium">Security keys</div>
                      <div className="text-xs text-muted-foreground">
                        WebAuthn 2FA only
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    Not configured
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddSecurityKey}
                    disabled={isLoading}
                    className="text-xs h-7"
                  >
                    Add
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Recovery Code</CardTitle>
          <CardDescription>
            Use this recovery code to access your account if you lose access to
            your two-factor authentication methods.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground mb-2">
              Your recovery code is:
            </div>
            <div className="flex items-center gap-2">
              <code className="text-lg font-mono font-semibold tracking-wider">
                {recoveryCode}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyRecoveryCode}
                className="h-8 w-8 p-0 transition-all duration-200"
              >
                {isCopied ? (
                  <IconCheck className="h-4 w-4 text-green-600 animate-in zoom-in-50 duration-200" />
                ) : (
                  <IconCopy className="h-4 w-4 animate-in zoom-in-50 duration-200" />
                )}
              </Button>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleGenerateNewCode}
              disabled={isLoading}
            >
              {isLoading ? "Generating..." : "Generate new code"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
