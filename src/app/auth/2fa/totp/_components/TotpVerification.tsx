"use server"
import { api } from "@/trpc/server"
import { redirect } from "next/navigation"
import { TotpVerificationForm } from "./TotpVerificationForm"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export const TotpVerification = async () => {
    const sessionResult = await api.session.getSession()

    if (!sessionResult || !sessionResult.user || !sessionResult.session) {
        redirect("/auth/login")
    }

    const { user, session } = sessionResult

    // If user doesn't have email verified, redirect to email verification
    if (!user.email_verified) {
        redirect("/auth/verify-email")
    }

    // If user doesn't have TOTP registered, redirect to setup
    if (!user.registered_totp) {
        redirect("/auth/2fa/totp/setup")
    }

    // If session is already 2FA verified, redirect to dashboard
    if (session.two_factor_verified) {
        redirect("/")
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>
                    Please enter your authentication code to continue.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <TotpVerificationForm />
            </CardContent>
        </Card>
    )
} 