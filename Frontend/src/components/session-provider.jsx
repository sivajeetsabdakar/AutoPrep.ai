"use client";

import { SessionProvider } from "next-auth/react";

export function AppSessionProvider({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
