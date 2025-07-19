"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, AlertCircle, KeyRound, Shield, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api } from "@/trpc/react"
import { encodeBase64, encodeBase64url } from "@oslojs/encoding"
import { useRouter } from "next/navigation"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export const PasskeyVerification = () => {
    const [isAuthenticating, setIsAuthenticating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)
    
    const router = useRouter()

    const generateAuthOptions = api.passkey.generateAuthenticationOptions.useMutation()
    const verifyAuthentication = api.passkey.verifyAuthentication.useMutation()

    const handleAuthenticate = async () => {
        setIsAuthenticating(true)
        setError(null)
        
        try {
            // Step 1: Get authentication options from server
            const options = await generateAuthOptions.mutateAsync()
            
            // Step 2: Get credential using WebAuthn API
            const credential = await navigator.credentials.get({
                publicKey: {
                    challenge: options.challenge,
                    allowCredentials: options.allowCredentials,
                    userVerification: options.userVerification,
                    timeout: options.timeout,
                }
            })

            if (!credential || !(credential instanceof PublicKeyCredential)) {
                throw new Error("Failed to get credential")
            }

            if (!(credential.response instanceof AuthenticatorAssertionResponse)) {
                throw new Error("Invalid credential response")
            }

            // Step 3: Send authentication data to server for verification
            const credentialId = encodeBase64url(new Uint8Array(credential.rawId))
            const signature = encodeBase64(new Uint8Array(credential.response.signature))
            const authenticatorData = encodeBase64(new Uint8Array(credential.response.authenticatorData))
            const clientDataJSON = encodeBase64(new Uint8Array(credential.response.clientDataJSON))

            await verifyAuthentication.mutateAsync({
                credentialId,
                signature,
                authenticatorData,
                clientDataJSON,
            })

            setIsSuccess(true)
            toast.success("Authentication successful!")
            
            // Redirect to home after a brief delay
            setTimeout(() => {
                router.push("/")
            }, 1500)
            
        } catch (err: any) {
            console.error("Passkey authentication error:", err)
            let errorMessage = "Authentication failed. Please try again."
            
            if (err?.message) {
                if (err.message.includes("User cancelled") || err.message.includes("NotAllowedError")) {
                    errorMessage = "Authentication was cancelled. Please try again."
                } else if (err.message.includes("NotSupportedError")) {
                    errorMessage = "Passkeys are not supported on this device or browser."
                } else if (err.message.includes("SecurityError")) {
                    errorMessage = "Security error. Please ensure you're on a secure connection."
                } else if (err.message.includes("No passkeys found")) {
                    errorMessage = "No passkeys found for your account. Please set up a passkey first."
                } else if (err.message.includes("Invalid signature")) {
                    errorMessage = "Authentication failed. The passkey signature is invalid."
                } else {
                    errorMessage = err.message
                }
            }
            
            setError(errorMessage)
            toast.error("Authentication failed")
        } finally {
            setIsAuthenticating(false)
        }
    }

    const handleRetry = () => {
        setError(null)
        setIsSuccess(false)
    }

    if (isSuccess) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="size-5" />
                        Authentication Successful
                    </CardTitle>
                    <CardDescription>
                        You have been successfully authenticated with your passkey.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                            Redirecting you to the dashboard...
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <KeyRound className="size-5" />
                    Authenticate with Passkey
                </CardTitle>
                <CardDescription>
                    Use your registered passkey to complete the two-factor authentication.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {error}
                        </AlertDescription>
                    </Alert>
                )}
                
                <div className="flex flex-col items-center gap-4 p-6 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                        <Shield className="size-8 text-primary" />
                    </div>
                    <div className="text-center">
                        <h3 className="font-medium">Ready to Authenticate</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Click the button below to use your passkey for authentication
                        </p>
                    </div>
                </div>
                
                <Button 
                    onClick={handleAuthenticate}
                    disabled={isAuthenticating}
                    className="w-full"
                    size="lg"
                >
                    {isAuthenticating ? (
                        <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Authenticating...
                        </>
                    ) : (
                        <>
                            <KeyRound className="mr-2 size-4" />
                            Authenticate with Passkey
                        </>
                    )}
                </Button>
                
                {error && (
                    <Button 
                        variant="outline" 
                        onClick={handleRetry}
                        className="w-full"
                    >
                        Try Again
                    </Button>
                )}
                
                <div className="text-xs text-muted-foreground text-center">
                    You'll be prompted to use your device's authentication method (Face ID, Touch ID, PIN, etc.)
                </div>
            </CardContent>
        </Card>
    )
} 