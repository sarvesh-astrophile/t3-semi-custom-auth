import { Suspense } from "react"
import { PasskeySetup } from "./_components/PasskeySetup"
import Loading from "./loading"

const PasskeySetupPage = () => {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Suspense fallback={<Loading />}>
                <PasskeySetup />
            </Suspense>
        </div>
    )
}

export default PasskeySetupPage