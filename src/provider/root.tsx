import React from "react";
import { AuthProvider } from "./auth-provider";
import { Session } from "next-auth";
export const RootProvider = ({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session;
}) => {
  return <AuthProvider session={session}>{children}</AuthProvider>;
};
