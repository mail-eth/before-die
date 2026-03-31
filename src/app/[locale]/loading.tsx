import { dictionaries, isLocale, type Locale } from "@/lib/content";

export default async function LoadingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const copy = isLocale(locale) ? dictionaries[locale] : dictionaries.id;

  const skeletonItems = Array.from({ length: 6 });

  return (
    <main className="relative flex min-h-screen w-full flex-col">
      {/* Header skeleton */}
      <header className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-border/50 bg-background/70 px-6 py-4 backdrop-blur-md md:px-10 lg:px-14">
        <div className="h-7 w-28 animate-pulse rounded-md bg-muted-foreground/10" />
        <div className="flex items-center gap-3">
          <div className="h-9 w-16 animate-pulse rounded-full bg-muted-foreground/10" />
          <div className="h-9 w-9 animate-pulse rounded-full bg-muted-foreground/10" />
        </div>
      </header>

      {/* Hero skeleton */}
      <section className="flex flex-col items-center justify-center px-6 pt-24 pb-20 text-center md:px-10 lg:px-14">
        <div className="mb-6 h-4 w-48 animate-pulse rounded-md bg-muted-foreground/10" />
        <div className="mb-4 h-20 w-96 max-w-full animate-pulse rounded-xl bg-muted-foreground/10" />
        <div className="mt-8 h-5 w-72 animate-pulse rounded-md bg-muted-foreground/10" />
        <div className="mt-10 flex gap-4">
          <div className="h-12 w-44 animate-pulse rounded-full bg-muted-foreground/10" />
          <div className="h-12 w-44 animate-pulse rounded-full bg-muted-foreground/10" />
        </div>
      </section>

      {/* Dream wall skeleton */}
      <section className="relative px-6 pb-24 md:px-10 lg:px-14">
        <div className="mb-14">
          <div className="mb-2 h-4 w-24 animate-pulse rounded-md bg-muted-foreground/10" />
          <div className="h-10 w-48 animate-pulse rounded-md bg-muted-foreground/10" />
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {skeletonItems.map((_, i) => (
            <div
              key={i}
              className="flex flex-col rounded-2xl border border-border/60 bg-card/70 p-7"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="h-6 w-24 animate-pulse rounded-full bg-muted-foreground/10" />
                <div className="h-4 w-16 animate-pulse rounded-md bg-muted-foreground/10" />
              </div>
              <div className="mb-4 h-6 w-full animate-pulse rounded-md bg-muted-foreground/10" />
              <div className="mt-auto space-y-2">
                <div className="h-4 w-full animate-pulse rounded-md bg-muted-foreground/10" />
                <div className="h-4 w-4/5 animate-pulse rounded-md bg-muted-foreground/10" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
