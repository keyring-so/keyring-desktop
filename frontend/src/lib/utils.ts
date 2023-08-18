import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { TRUNCATED_ADDRESS_END_CHARS, TRUNCATED_ADDRESS_START_CHARS, TRUNCATED_NAME_CHAR_LIMIT } from "./labels";
import { toast } from "@/components/ui/use-toast";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortenAddress(address: string) {
  if (address.length < TRUNCATED_NAME_CHAR_LIMIT) {
    return address;
  }

  return `${address.slice(0, TRUNCATED_ADDRESS_START_CHARS)}...${address.slice(
    -TRUNCATED_ADDRESS_END_CHARS,
  )}`;
}

export function errToast(err: any) {
  toast({
    title: "Uh oh! Something went wrong.",
    description: `Error happens: ${err}`,
  });
}
