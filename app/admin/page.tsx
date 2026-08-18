import type { Metadata } from "next";
import AdminClient from "@/components/AdminClient";

export const metadata: Metadata = {
  title: "관리",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminClient />;
}
