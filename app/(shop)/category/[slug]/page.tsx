type CategoryPageProps = {
  params: {
    slug: string;
  };
};

export default function CategoryPage({ params }: CategoryPageProps) {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-foreground">
        Category: {params.slug}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Product list and filters will be rendered here.
      </p>
    </main>
  );
}
