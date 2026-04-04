export type AppRoute = {
  href: string;
  label: string;
};

export const appRoutes: AppRoute[] = [
  { href: "/", label: "Overview" },
  { href: "/sessions", label: "Sessions" },
  { href: "/cron", label: "Cron" },
  { href: "/skills", label: "Skills" },
  { href: "/memory", label: "Memory" },
  { href: "/setup", label: "Setup" },
  { href: "/files", label: "Files" },
];
