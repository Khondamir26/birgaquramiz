import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="page-shell flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm />
      </div>
    </div>
  );
}
