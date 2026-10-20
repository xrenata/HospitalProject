"use client";

import ResourceModule from "@/components/ResourceModule";
import { MODULES } from "@/lib/modules";

export default function Page() {
  return <ResourceModule cfg={MODULES.ambulances} />;
}
