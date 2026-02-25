import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
  return (
    <div className="page-shell flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-sm md:max-w-4xl">
        <SignupForm />
      </div>
    </div>
  );
}
