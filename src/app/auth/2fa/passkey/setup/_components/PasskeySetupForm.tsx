"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, CheckCircle, AlertCircle, KeyRound } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api } from "@/trpc/react"
import { encodeBase64 } from "@oslojs/encoding"
import { useRouter } from "next/navigation"

export const PasskeySetupForm = () => {
    const [isCreating, setIsCreating] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [passkeyName, setPasskeyName] = useState("My Passkey")
    
    const router = useRouter()

    const generateOptions = api.passkey.generateRegistrationOptions.useMutation()
    const verifyRegistration = api.passkey.verifyRegistration.useMutation()

    const handleCreatePasskey = async () => {
        if (!passkeyName.trim()) {
            setError("Please enter a name for your passkey")
            return
        }

        setIsCreating(true)
        setError(null)
        
        try {
            // Step 1: Get registration options from server
            const options = await generateOptions.mutateAsync()
            
            // Step 2: Create credential using WebAuthn API
            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge: options.challenge,
                    rp: options.rp,
                    user: options.user,
                    pubKeyCredParams: options.pubKeyCredParams,
                    attestation: options.attestation,
                    authenticatorSelection: options.authenticatorSelection,
                    timeout: options.timeout,
                }
            })

            if (!credential || !(credential instanceof PublicKeyCredential)) {
                throw new Error("Failed to create credential")
            }

            if (!(credential.response instanceof AuthenticatorAttestationResponse)) {
                throw new Error("Invalid credential response")
            }

            // Step 3: Send credential to server for verification
            const attestationObject = encodeBase64(new Uint8Array(credential.response.attestationObject))
            const clientDataJSON = encodeBase64(new Uint8Array(credential.response.clientDataJSON))

            await verifyRegistration.mutateAsync({
                name: passkeyName.trim(),
                attestationObject,
                clientDataJSON,
            })

            setIsSuccess(true)
            toast.success("Passkey created successfully!")
            
        } catch (err: any) {
            console.error("Passkey creation error:", err)
            let errorMessage = "Failed to create passkey. Please try again."
            
            if (err?.message) {
                if (err.message.includes("User cancelled") || err.message.includes("NotAllowedError")) {
                    errorMessage = "Passkey creation was cancelled. Please try again."
                } else if (err.message.includes("NotSupportedError")) {
                    errorMessage = "Passkeys are not supported on this device or browser."
                } else if (err.message.includes("SecurityError")) {
                    errorMessage = "Security error. Please ensure you're on a secure connection."
                } else if (err.message.includes("InvalidStateError")) {
                    errorMessage = "A passkey already exists for this device."
                } else {
                    errorMessage = err.message
                }
            }
            
            setError(errorMessage)
            toast.error("Failed to create passkey")
        } finally {
            setIsCreating(false)
        }
    }

    const handleRetry = () => {
        setError(null)
        setIsSuccess(false)
        setPasskeyName("My Passkey")
    }

    const handleContinue = () => {
        router.push("/")
    }

    if (isSuccess) {
        return (
            <div className="flex flex-col gap-4 w-full">
                <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                        Passkey has been successfully created and enabled for your account.
                    </AlertDescription>
                </Alert>
                <Button 
                    onClick={handleContinue}
                    className="w-full"
                >
                    Continue to Dashboard
                </Button>
                <Button 
                    variant="outline" 
                    onClick={handleRetry}
                    className="w-full"
                >
                    Create Another Passkey
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {error}
                    </AlertDescription>
                </Alert>
            )}
            
            <div className="space-y-2">
                <Label htmlFor="passkey-name">Passkey Name</Label>
                <Input
                    id="passkey-name"
                    value={passkeyName}
                    onChange={(e) => setPasskeyName(e.target.value)}
                    placeholder="Enter a name for this passkey"
                    disabled={isCreating}
                />
                <p className="text-xs text-muted-foreground">
                    Give your passkey a memorable name (e.g., "iPhone", "MacBook", "Work Computer")
                </p>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
                Click the button below to create your passkey. You'll be prompted to use your device's authentication method.
            </div>
            
            <Button 
                onClick={handleCreatePasskey}
                disabled={isCreating || !passkeyName.trim()}
                className="w-full"
                size="lg"
            >
                {isCreating ? (
                    <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Creating Passkey...
                    </>
                ) : (
                    <>
                        <KeyRound className="mr-2 size-4" />
                        Create Passkey
                    </>
                )}
            </Button>
            
            <div className="text-xs text-muted-foreground text-center">
                Make sure your device supports biometric authentication or has a screen lock enabled.
            </div>
        </div>
    )
} 