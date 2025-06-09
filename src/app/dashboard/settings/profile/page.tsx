import { AccountForm } from "./_components/account-form";
import { PasswordForm } from "./_components/password-form";

export default function ProfileSettingsPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 max-w-8xl mx-auto">
      <div>
        <h3 className="text-lg font-medium">Profile Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and set e-mail preferences.
        </p>
      </div>
      <AccountForm />
      <PasswordForm />
    </div>
  );
}
