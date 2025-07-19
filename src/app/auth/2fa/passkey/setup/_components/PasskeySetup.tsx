"use client"
import { PasskeySetupForm } from "./PasskeySetupForm"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { KeyRound, Shield, Smartphone, Fingerprint } from "lucide-react"

export const PasskeySetup = () => {
    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <KeyRound className="size-5" />
                    Set up Passkey Authentication
                </CardTitle>
                <CardDescription>
                    Create a passkey for secure, passwordless authentication using biometrics or security keys.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
                <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-muted/30">
                        <Fingerprint className="size-8 text-primary" />
                        <span className="text-sm font-medium">Biometrics</span>
                        <span className="text-xs text-muted-foreground text-center">
                            Face ID, Touch ID, or fingerprint
                        </span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-muted/30">
                        <Smartphone className="size-8 text-primary" />
                        <span className="text-sm font-medium">Device PIN</span>
                        <span className="text-xs text-muted-foreground text-center">
                            Screen lock or PIN
                        </span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="size-4" />
                    <span>Your passkey will be stored securely on this device</span>
                </div>
                
                <PasskeySetupForm />
            </CardContent>
        </Card>
    )
} 