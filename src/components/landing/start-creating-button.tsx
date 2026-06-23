"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

type StartCreatingButtonProps = {
  className?: string;
  label?: string;
  loadingLabel?: string;
};

export function StartCreatingButton({
  className,
  label = "Start Creating",
  loadingLabel = "Opening...",
}: StartCreatingButtonProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);

  async function handleStartCreating() {
    setIsChecking(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      router.push(user ? "/agents" : "/auth?mode=signup");
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={handleStartCreating}
      disabled={isChecking}
      className={cn("min-w-40", className)}
    >
      {isChecking ? loadingLabel : label}
    </Button>
  );
}
