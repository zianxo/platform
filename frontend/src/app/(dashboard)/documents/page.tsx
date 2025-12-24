"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DocumentsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/documents/all");
  }, [router]);

  return <div className="p-8">Loading...</div>;
}
