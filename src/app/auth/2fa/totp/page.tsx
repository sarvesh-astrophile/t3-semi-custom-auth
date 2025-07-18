import React, { Suspense } from 'react'
import Loading from './loading'
import { TotpVerification } from './_components/TotpVerification'

const TotpPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<Loading />}>
        <TotpVerification />
      </Suspense>
    </div>
  )
}

export default TotpPage