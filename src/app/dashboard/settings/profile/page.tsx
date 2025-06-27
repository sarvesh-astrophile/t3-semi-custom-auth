import { AccountForm } from "./_components/account-form";
import { PasswordForm } from "./_components/password-form";
import { TwoFactorForm } from "./_components/two-factor-form";

export default function ProfileSettingsPage() {
  return (
    <div className="flex justify-center items-center">
      <div className="space-y-6 p-4 md:p-8 max-w-2xl w-full">
        <div>
          <h3 className="text-lg font-medium">Profile Settings</h3>
          <p className="text-sm text-muted-foreground">
            Manage your account settings and set e-mail preferences.
          </p>
        </div>
        <AccountForm />
        <PasswordForm />
        <TwoFactorForm />
      </div>
    </div>
  );
}
