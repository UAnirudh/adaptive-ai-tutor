import { SignIn } from "@clerk/nextjs";
import { Brain } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="flex-1 grid place-items-center px-4 py-12">
      <div className="mb-6 text-center">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-md bg-primary text-primary-foreground">
          <Brain className="h-5 w-5" />
        </div>
        <h1 className="mt-4 text-xl font-semibold">Admin access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Private beta features are restricted to the founder account.
        </p>
      </div>
      <SignIn
        appearance={{
          elements: {
            cardBox: "shadow-2xl",
          },
        }}
      />
    </main>
  );
}
