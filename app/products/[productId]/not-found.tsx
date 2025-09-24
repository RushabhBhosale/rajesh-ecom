import Link from "next/link";
import { PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 text-center">
      <div className="flex size-24 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white shadow-sm">
        <PackageSearch className="h-10 w-10 text-slate-400" />
      </div>
      <h1 className="mt-8 text-3xl font-semibold text-slate-900 sm:text-4xl">
        We couldn&apos;t find that device
      </h1>
      <p className="mt-3 max-w-md text-base text-slate-600">
        It may have been removed or is no longer available for enterprise deployment. Explore our
        catalog to discover similar, certified hardware.
      </p>
      <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
        <Button asChild size="lg" className="rounded-full px-8">
          <Link href="/products">Browse products</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="rounded-full border-slate-300">
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </main>
  );
}
