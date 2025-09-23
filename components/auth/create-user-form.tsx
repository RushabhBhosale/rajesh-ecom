"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Role } from "@/models/user";

interface CreateUserFormProps {
  allowedRoles: Role[];
  heading: string;
  description?: string;
}

type CreateUserValues = {
  name: string;
  email: string;
  password: string;
  role: Role;
};

export function CreateUserForm({ allowedRoles, heading, description }: CreateUserFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = useMemo(() => {
    const roleEnum = allowedRoles.length
      ? z.enum([...allowedRoles] as [Role, ...Role[]])
      : z.enum(["user"] as [Role, ...Role[]]);

    return z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      email: z.string().email("Enter a valid email"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      role: roleEnum,
    });
  }, [allowedRoles]);

  const form = useForm<CreateUserValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: allowedRoles[0] ?? "user",
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
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.error
          ? typeof data.error === "string"
            ? data.error
            : Object.values<string[]>(data.error)[0]?.[0] ?? "Unable to create user"
          : "Unable to create user";
        setServerError(message);
        toast.error(message);
        return;
      }

      toast.success("User created successfully");
      reset({
        name: "",
        email: "",
        password: "",
        role: allowedRoles[0] ?? "user",
      });
      router.refresh();
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
        <CardTitle>{heading}</CardTitle>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Alex Doe" {...register("name")} />
            {errors.name ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.name.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="new-user@example.com" {...register("email")} />
            {errors.email ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.email.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Temporary password</Label>
            <Input id="password" type="password" placeholder="********" {...register("password")} />
            {errors.password ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.password.message}
              </p>
            ) : null}
          </div>
          {allowedRoles.length > 1 ? (
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                {...register("role")}
              >
                {allowedRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              {errors.role ? (
                <p className="text-sm text-destructive" role="alert">
                  {errors.role.message}
                </p>
              ) : null}
            </div>
          ) : null}
          {serverError ? (
            <p className="text-sm text-destructive" role="alert">
              {serverError}
            </p>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="ml-auto" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create user"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
