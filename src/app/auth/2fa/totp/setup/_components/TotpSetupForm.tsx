"use client"

import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import React, { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { api } from "@/trpc/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

const TotpSetupSchema = z.object({
    code: z.string().min(6, { message: "Your one-time password must be 6 characters." }),
})

export const TotpSetupForm = ({
    encodedTOTPKey,
}: {
    encodedTOTPKey: string
}) => {
    const [isMounted, setIsMounted] = useState(false)
    const router = useRouter()
    
    const verifyTotp = api.totp.verifyTotp.useMutation({
        onSuccess: () => {
            toast.success("2FA enabled successfully!")
            if (isMounted) {
                router.push("/")
            }
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    const form = useForm<z.infer<typeof TotpSetupSchema>>({
        resolver: zodResolver(TotpSetupSchema),
        defaultValues: {
            code: "",
        },
    })

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const onSubmit = (data: z.infer<typeof TotpSetupSchema>) => {
        verifyTotp.mutate(data)
    }

    // Prevent hydration mismatch by not rendering until mounted
    if (!isMounted) {
        return (
            <div className="flex flex-col gap-4 w-full">
                <div className="flex flex-col items-center gap-4">
                    <div className="text-center">One-Time Password</div>
                    <div className="flex justify-center">
                        <div className="flex gap-2">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="size-10 border border-input rounded-md bg-background"
                                />
                            ))}
                        </div>
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                        Enter the one-time password from your authenticator app.
                    </div>
                </div>
                <Button disabled>
                    Verify
                </Button>
            </div>
        )
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4 w-full"
            >
                <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                        <FormItem className="flex flex-col items-center">
                            <FormLabel className="text-center">One-Time Password</FormLabel>
                            <FormControl className="flex justify-center">
                                <InputOTP maxLength={6} {...field}>
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                </InputOTP>
                            </FormControl>
                            <FormDescription className="text-center">
                                Enter the one-time password from your authenticator app.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={verifyTotp.isPending}>
                    {verifyTotp.isPending && (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    Verify
                </Button>
            </form>
        </Form>
    )
}