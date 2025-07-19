import { Suspense } from "react"
import { PasskeyVerification } from "./_components/PasskeyVerification"
import Loading from "./loading"

const PasskeyAuthPage = () => {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Suspense fallback={<Loading />}>
                <PasskeyVerification />
            </Suspense>
        </div>
    )
}

export default PasskeyAuthPage