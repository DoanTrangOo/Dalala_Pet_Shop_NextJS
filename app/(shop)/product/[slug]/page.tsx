type ProductPageProps = {
  params: {
    slug: string;
  };
};

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-foreground">
        Product: {params.slug}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Product details, gallery, and buy actions will be here.
      </p>
    </main>
  );
}
