import { useState } from "react";

interface CopyButtonProps {
  url: string;
}

export default function CopyButton({ url }: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Error copying link to clipboard");
    }
  };

  return (
    <div className="flex w-full justify-end">
      <button
        className="border-slate-700 border rounded px-2 py-1"
        onClick={handleClick}
      >
        {isCopied ? "Copied" : "Copy Link"}
      </button>
    </div>
  );
}
