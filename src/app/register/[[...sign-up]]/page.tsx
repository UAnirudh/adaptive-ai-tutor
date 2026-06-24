import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <SignUp />
    </main>
  );
}
