import type { User } from "@/generated/client";

export function check2FAVerified(user: User): {is2FAVerified: boolean, redirectPath: string | null} {
    if (user.registered_passkey) {
        return {is2FAVerified: false, redirectPath: "/auth/2fa/passkey"}
    }
    if (user.registered_security_key) {
        return {is2FAVerified: false, redirectPath: "/auth/2fa/security-key"}
    }   
    if (user.registered_totp) {
        return {is2FAVerified: false, redirectPath: "/auth/2fa/totp"}
    }
    return {is2FAVerified: true, redirectPath: null}
}