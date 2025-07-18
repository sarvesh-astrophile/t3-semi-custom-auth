import { Suspense } from "react"
import { TotpSetup } from "./_components/TotpSetup"

const TotpSetupPage = () => {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Suspense>
                <TotpSetup />
            </Suspense>
        </div>
    )
}

export default TotpSetupPage