"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";

export const SignInButton = ({ redirect }: { redirect?: string }) => {
  return (
    <Button
      onClick={() =>
        signIn("google", redirect ? { callbackUrl: redirect } : undefined)
      }
    >
      Sign In
    </Button>
  );
};
