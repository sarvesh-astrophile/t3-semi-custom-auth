"use server"
import { check2FAVerified } from "@/lib/auth/2fa/2fa-utils"
import { api } from "@/trpc/server"
import { renderSVG } from "uqr"
import { redirect } from "next/navigation"
import { TotpSetupForm } from "./TotpSetupForm"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export const TotpSetup = async () => {
    const sessionResult = await api.session.getSession()

    if (!sessionResult || !sessionResult.user || !sessionResult.session) {
        redirect("/auth/login")
    }

    const { user, session } = sessionResult

    if (!user.email_verified) {
        redirect("/auth/verify-email")
    }

    if (user.registered_2FA && !session.two_factor_verified) {
        const { is2FAVerified, redirectPath } = check2FAVerified(user)
        if (!is2FAVerified && redirectPath !== null) {
            redirect(redirectPath)
        }
    }

    const { totpUrl, encodedTOTPKey } = await api.totp.generateTotpSecret();
    const qrCodeSvg = renderSVG(totpUrl);

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Set up Two-Factor Authentication</CardTitle>
                <CardDescription>
                    Scan this QR code with your authenticator app.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
                <div
                    className="size-48"
                    dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                />
                <TotpSetupForm encodedTOTPKey={encodedTOTPKey} />
            </CardContent>
        </Card>
    )
} 