import { Check, Copy } from "lucide-react";
import React from "react";
import { Button, type ButtonProps } from "~/components/ui/button";
import { useCopy } from "~/components/ui/copy-provider";

import { cn } from "~/lib/utils";

export interface CopyButtonProps extends Omit<ButtonProps, "onClick"> {
  text: string;
  copiedChildren?: React.ReactNode;
  onCopy?: () => void;
  CopyIcon?: React.ElementType;
  CopiedIcon?: React.ElementType;
}

export const CopyButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(
  (
    {
      text,
      children,
      className,
      CopiedIcon = Copy,
      CopyIcon = Check,
      copiedChildren,
      onCopy,
      ...props
    },
    ref,
  ) => {
    const { copiedText, copy } = useCopy();

    return (
      <Button
        ref={ref}
        className={cn("flex items-center gap-2", className)}
        onClick={() => {
          copy(text);
          if (onCopy) {
            onCopy();
          }
        }}
        {...props}
      >
        {copiedText === text ? <CopyIcon /> : <CopiedIcon />}
        {copiedText === text ? copiedChildren : children}
      </Button>
    );
  },
);
CopyButton.displayName = "CopyButton";
