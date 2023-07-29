export function cn(...classes: (string | boolean)[]): string {
  return classes.filter(Boolean).join(" ");
}

export type Runnable = {
  name: string;
  file_name?: string;
  icon?: string;
  exec: string;
};
