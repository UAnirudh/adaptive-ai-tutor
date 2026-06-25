import { SignUp } from "@clerk/nextjs";
import { Brain } from "lucide-react";

export default function RegisterPage() {
  return (
    <main className="flex-1 grid place-items-center px-4 py-12 bg-[#11100d]">
      <div className="mb-6 text-center">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-md bg-[#e7dfce] text-[#15130f]">
          <Brain className="h-5 w-5" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-white">Create your account</h1>
        <p className="mt-2 text-sm text-white/50">
          Sign up to save your spot on the waitlist and get early access.
        </p>
      </div>
      <SignUp
        forceRedirectUrl="/dashboard"
        appearance={{
          elements: {
            cardBox: "shadow-2xl",
          },
        }}
      />
    </main>
  );
}
