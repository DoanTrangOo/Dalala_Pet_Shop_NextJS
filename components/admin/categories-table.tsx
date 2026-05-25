import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { CategoryRowActions } from "./category-row-actions";
import type { CategoryRow } from "./category-form-dialog";

type CategoriesTableProps = {
  categories: CategoryRow[];
};

export function CategoriesTable({ categories }: CategoriesTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                No categories yet. Add your first category from the button above.
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium text-foreground">{category.name}</TableCell>
                <TableCell>{category.slug}</TableCell>
                <TableCell className="max-w-md text-sm text-muted-foreground">
                  {category.description || "-"}
                </TableCell>
                <TableCell className="text-right">
                  <CategoryRowActions category={category} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
