import type React from "react"
import Link from "next/link"
import { Shield } from "lucide-react"

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  description: string
  backLinkHref?: string
  backLinkText?: string
}

export function AuthLayout({ children, title, description, backLinkHref, backLinkText }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">{title}</h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow-sm border border-border sm:rounded-lg sm:px-10">{children}</div>

        {backLinkHref && backLinkText && (
          <div className="mt-4 text-center">
            <Link href={backLinkHref} className="text-sm font-medium text-primary hover:text-primary/90">
              {backLinkText}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

