"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { categoryPayloadSchema } from "@/lib/category-validation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CategoryFormValues = {
  name: string;
  description: string;
};

interface CategoryFormProps {
  mode?: "create" | "edit";
  categoryId?: string;
  onSuccess?: () => void;
  redirectTo?: string;
  initialValues?: Partial<CategoryFormValues>;
}

export function CategoryForm({
  mode = "create",
  categoryId,
  onSuccess,
  redirectTo,
  initialValues,
}: CategoryFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditMode = mode === "edit" && Boolean(categoryId);

  const form = useForm({
    resolver: zodResolver(categoryPayloadSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? "",
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);

    try {
      const endpoint = isEditMode ? `/api/categories/${categoryId}` : "/api/categories";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          description: values.description,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.error
          ? typeof data.error === "string"
            ? data.error
            : Object.values<string[]>(data.error)[0]?.[0] ??
              "Unable to create category"
          : "Unable to create category";
        setServerError(message);
        toast.error(message);
        return;
      }

      toast.success(isEditMode ? "Category updated" : "Category created");
      if (!isEditMode) {
        reset({ name: "", description: "" });
      }
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
      onSuccess?.();
    } catch (error) {
      console.error(error);
      const message = "Unable to reach the server. Please try again.";
      setServerError(message);
      toast.error(message);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-foreground">
          {mode === "edit" ? "Edit category" : "Add a new category"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Organise your catalogue by creating categories before assigning them to products.
        </p>
      </CardHeader>
      <form onSubmit={onSubmit} className="space-y-6">
        <CardContent className="grid gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Category name</Label>
            <Input id="name" placeholder="Laptops" {...register("name")} />
            {errors.name ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.name.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the types of products that belong to this category."
              className="min-h-[120px]"
              {...register("description")}
            />
            <p className="text-xs text-muted-foreground">
              Optional. Helps team members choose the right category during
              product creation.
            </p>
            {errors.description ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.description.message}
              </p>
            ) : null}
          </div>
          {serverError ? (
            <p className="text-sm text-destructive" role="alert">
              {serverError}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditMode ? "Save changes" : "Create category"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
