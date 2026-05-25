import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ProductCategory, ProductEditorData } from "./product-form-dialog";
import { ProductRowActions } from "./product-row-actions";

type ProductRow = ProductEditorData & {
  categories: ProductCategory | null;
  product_images: { image_url: string; sort_order: number }[] | null;
};

type ProductsTableProps = {
  products: ProductRow[];
  categories: ProductCategory[];
};

export function ProductsTable({ products, categories }: ProductsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                No products yet. Add your first product from the button above.
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => {
              const category = product.categories;
              const cover = product.product_images?.[0]?.image_url;

              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-lg border bg-muted">
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cover} alt={product.name} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{product.name}</div>
                        <div className="text-xs text-muted-foreground">{product.slug}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{category?.name ?? "Uncategorized"}</TableCell>
                  <TableCell>${Number(product.price).toFixed(2)}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "Active" : "Hidden"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <ProductRowActions product={product} categories={categories} />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
