export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white via-slate-50 to-white px-6 py-16">
      <div className="max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Dalala Pet Shop
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Everything for happy pets
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          Home, category, and product experiences will evolve from this base.
        </p>
      </div>
    </main>
  );
}
