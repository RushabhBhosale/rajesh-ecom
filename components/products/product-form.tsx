"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import {
  MAX_PRODUCT_HIGHLIGHTS,
  productConditions,
} from "@/lib/product-constants";
import type { ProductSummary } from "@/lib/products";
import type { CategorySummary } from "@/lib/categories";
import {
  masterTypeLabels,
  type MasterOptionSummary,
  type MasterOptionType,
} from "@/lib/master-constants";
import type { SubMasterOptionSummary } from "@/lib/submaster-constants";
import { RichTextEditor } from "@/components/products/rich-text-editor";
import { validateUrlOrUpload } from "@/lib/product-validation";

interface ProductFormProps {
  mode: "create" | "update";
  product?: ProductSummary;
  onSuccess?: () => void;
  onCancel?: () => void;
  redirectTo?: string;
}

const conditionLabels: Record<(typeof productConditions)[number], string> = {
  refurbished: "Certified refurbished",
  new: "Brand new",
};

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

type MasterOptionState = Record<MasterOptionType, MasterOptionSummary[]>;
type SubMasterLookup = Record<
  MasterOptionType,
  Record<string, SubMasterOptionSummary[]>
>;
type VariantSelection = {
  processorId?: string;
  ramId?: string;
  storageId?: string;
  graphicsId?: string;
  color?: string;
  note?: string;
};

function createEmptyMasters(): MasterOptionState {
  return {
    company: [],
    processor: [],
    ram: [],
    storage: [],
    graphics: [],
    os: [],
  };
}

function createEmptySubMasters(): SubMasterLookup {
  return {
    company: {},
    processor: {},
    ram: {},
    storage: {},
    graphics: {},
    os: {},
  };
}

const masterFieldMap: Record<
  "companyId" | "processorId" | "ramId" | "storageId" | "graphicsId" | "osId",
  MasterOptionType
> = {
  companyId: "company",
  processorId: "processor",
  ramId: "ram",
  storageId: "storage",
  graphicsId: "graphics",
  osId: "os",
};

const subMasterFieldMap: Record<
  | "companySubMasterId"
  | "processorSubMasterId"
  | "ramSubMasterId"
  | "storageSubMasterId"
  | "graphicsSubMasterId"
  | "osSubMasterId",
  MasterOptionType
> = {
  companySubMasterId: "company",
  processorSubMasterId: "processor",
  ramSubMasterId: "ram",
  storageSubMasterId: "storage",
  graphicsSubMasterId: "graphics",
  osSubMasterId: "os",
};

const subMasterParentFieldMap: Record<
  keyof typeof subMasterFieldMap,
  keyof ProductFormValues
> = {
  companySubMasterId: "companyId",
  processorSubMasterId: "processorId",
  ramSubMasterId: "ramId",
  storageSubMasterId: "storageId",
  graphicsSubMasterId: "graphicsId",
  osSubMasterId: "osId",
};

function createMastersFromProduct(
  product: ProductSummary | undefined
): MasterOptionState {
  const seeded = createEmptyMasters();
  if (!product) {
    return seeded;
  }

  (
    ["company", "processor", "ram", "storage", "graphics", "os"] as const
  ).forEach((type) => {
    const option = product[type];
    if (option?.id) {
      seeded[type] = [
        {
          id: option.id,
          name: option.name || "Current selection",
          type,
        },
      ];
    }
  });

  return seeded;
}

interface ColorOptionsEditorProps {
  value: string[];
  onChange: (colors: string[]) => void;
  onBlur?: () => void;
  error?: string;
  onClearErrors?: () => void;
}

function ColorOptionsEditor({
  value,
  onChange,
  onBlur,
  error,
  onClearErrors,
}: ColorOptionsEditorProps) {
  const [colorInput, setColorInput] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const normalizedValue = Array.isArray(value) ? value.slice(0, 1) : [];
  const reachedLimit = normalizedValue.length >= 1;
  const trimmedInput = colorInput.trim();
  const canAddColor = trimmedInput.length > 0;
  const errorMessage = localError ?? error ?? null;

  function handleAddColor() {
    const trimmed = trimmedInput;
    if (!trimmed) {
      setLocalError("Enter a colour name before adding.");
      return;
    }
    const exists = normalizedValue.some(
      (item) => item.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setLocalError("That colour has already been added.");
      return;
    }
    if (normalizedValue.length >= 1) {
      setLocalError("Only one colour is allowed. Add more via variants.");
      return;
    }

    const next = [...normalizedValue, trimmed];
    setLocalError(null);
    setColorInput("");
    onClearErrors?.();
    onChange(next);
    onBlur?.();
  }

  function handleRemoveColor(index: number) {
    const next = normalizedValue.filter((_, itemIndex) => itemIndex !== index);
    setLocalError(null);
    onClearErrors?.();
    onChange(next);
    onBlur?.();
  }

  return (
    <div className="space-y-3">
      {!reachedLimit ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            id="colors"
            value={colorInput}
            placeholder="Enter a colour name or hex value"
            onChange={(event) => {
              setColorInput(event.target.value);
              if (localError) {
                setLocalError(null);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAddColor();
              }
            }}
            className="sm:max-w-[260px]"
            aria-describedby="colors-helper"
            aria-invalid={Boolean(errorMessage)}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleAddColor}
            disabled={!canAddColor}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" /> Add colour
          </Button>
        </div>
      ) : (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Only one colour is allowed. Remove the current colour to switch.
        </div>
      )}
      {normalizedValue.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {normalizedValue.map((color, index) => (
            <div
              key={`${color}-${index}`}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm"
            >
              <span
                className="size-5 rounded-full border border-slate-200"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              <span className="font-medium text-slate-700">{color}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 rounded-full text-slate-500 hover:text-slate-700"
                onClick={() => handleRemoveColor(index)}
                aria-label={`Remove ${color}`}
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No colours added yet.</p>
      )}
      {errorMessage ? (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

interface StoragePillSelectorProps {
  options: MasterOptionSummary[];
  value?: string;
  onChange: (value?: string) => void;
  disabled?: boolean;
}

function StoragePillSelector({
  options,
  value,
  onChange,
  disabled,
}: StoragePillSelectorProps) {
  if (!options.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No storage options found yet.
      </p>
    );
  }

  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Storage options"
    >
      {options.map((option) => {
        const isActive = value === option.id;
        return (
          <Button
            key={option.id}
            type="button"
            variant={isActive ? "default" : "outline"}
            className="rounded-full px-3 py-2 text-xs font-semibold sm:text-sm"
            onClick={() => onChange(isActive ? undefined : option.id)}
            disabled={disabled}
            aria-pressed={isActive}
          >
            {option.name}
          </Button>
        );
      })}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="rounded-full"
        onClick={() => onChange(undefined)}
        disabled={disabled}
      >
        Clear
      </Button>
    </div>
  );
}

type ProductFormValues = {
  name: string;
  category: string;
  description: string;
  price: number;
  discountedPrice: number;
  condition: (typeof productConditions)[number];
  companyId?: string;
  companySubMasterId?: string;
  processorId?: string;
  processorSubMasterId?: string;
  ramId?: string;
  ramSubMasterId?: string;
  storageId?: string;
  storageSubMasterId?: string;
  graphicsId?: string;
  graphicsSubMasterId?: string;
  osId?: string;
  osSubMasterId?: string;
  imageUrl: string;
  featured: boolean;
  inStock: boolean;
  highlights: string;
  variants: {
    label: string;
    price: number;
    discountedPrice: number;
    description?: string;
    imageUrl?: string;
    galleryImages?: string[];
    processorId?: string;
    ramId?: string;
    storageId?: string;
    graphicsId?: string;
    color?: string;
    condition?: (typeof productConditions)[number];
  }[];
  colors: string[];
  galleryImages: { url: string }[];
  richDescription: string;
};

export function ProductForm({
  mode,
  product,
  onSuccess,
  onCancel,
  redirectTo,
}: ProductFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [categories, setCategories] = useState<
    Pick<CategorySummary, "id" | "name">[]
  >([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [masters, setMasters] = useState<MasterOptionState>(() =>
    createMastersFromProduct(product)
  );
  const [isLoadingMasters, setIsLoadingMasters] = useState(true);
  const [mastersError, setMastersError] = useState<string | null>(null);
  const [subMasters, setSubMasters] = useState<SubMasterLookup>(() =>
    createEmptySubMasters()
  );
  const [isLoadingSubMasters, setIsLoadingSubMasters] = useState(true);
  const [subMastersError, setSubMastersError] = useState<string | null>(null);
  const [isUploadingPrimary, setIsUploadingPrimary] = useState(false);
  const [galleryUploadingIndex, setGalleryUploadingIndex] = useState<
    number | null
  >(null);

  const schema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .max(200, "Name must be under 200 characters")
          .optional()
          .refine((val) => !val || val.length >= 3, {
            message: "Name must be at least 3 characters",
          })
          .default(""),
        category: z.string().min(2, "Category must be at least 2 characters"),
        description: z
          .string()
          .min(10, "Description must be at least 10 characters"),
        price: z.coerce.number().min(0, "Price must be 0 or greater"),
        discountedPrice: z
          .coerce.number()
          .min(0, "Discounted price must be 0 or greater")
          .optional()
          .default(0),
        condition: z.enum(productConditions),
        companyId: z
          .union([
            z.string().trim().regex(objectIdRegex, "Select a valid company"),
            z.literal(""),
          ])
          .optional()
          .default(""),
        companySubMasterId: z
          .union([
            z
              .string()
              .trim()
              .regex(objectIdRegex, "Select a valid company submaster"),
            z.literal(""),
          ])
          .optional()
          .default(""),
        processorId: z
          .union([
            z.string().trim().regex(objectIdRegex, "Select a valid processor"),
            z.literal(""),
          ])
          .optional()
          .default(""),
        processorSubMasterId: z
          .union([
            z
              .string()
              .trim()
              .regex(objectIdRegex, "Select a valid processor submaster"),
            z.literal(""),
          ])
          .optional()
          .default(""),
        ramId: z
          .union([
            z.string().trim().regex(objectIdRegex, "Select a valid RAM option"),
            z.literal(""),
          ])
          .optional()
          .default(""),
        ramSubMasterId: z
          .union([
            z
              .string()
              .trim()
              .regex(objectIdRegex, "Select a valid RAM submaster"),
            z.literal(""),
          ])
          .optional()
          .default(""),
        storageId: z
          .union([
            z
              .string()
              .trim()
              .regex(objectIdRegex, "Select a valid storage option"),
            z.literal(""),
          ])
          .optional()
          .default(""),
        storageSubMasterId: z
          .union([
            z
              .string()
              .trim()
              .regex(objectIdRegex, "Select a valid storage submaster"),
            z.literal(""),
          ])
          .optional()
          .default(""),
        graphicsId: z
          .union([
            z
              .string()
              .trim()
              .regex(objectIdRegex, "Select a valid graphics option"),
            z.literal(""),
          ])
          .optional()
          .default(""),
        graphicsSubMasterId: z
          .union([
            z
              .string()
              .trim()
              .regex(objectIdRegex, "Select a valid graphics submaster"),
            z.literal(""),
          ])
          .optional()
          .default(""),
        osId: z
          .union([
            z
              .string()
              .trim()
              .regex(objectIdRegex, "Select a valid operating system"),
            z.literal(""),
          ])
          .optional()
          .default(""),
        osSubMasterId: z
          .union([
            z
              .string()
              .trim()
              .regex(objectIdRegex, "Select a valid OS submaster"),
            z.literal(""),
          ])
          .optional()
          .default(""),
        imageUrl: z
          .string()
          .trim()
          .superRefine((val, ctx) => {
            if (!val) {
              return;
            }
            if (val.startsWith("/uploads/")) {
              return;
            }
            try {
              // eslint-disable-next-line no-new
              new URL(val);
            } catch {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Enter a valid URL or upload an image",
              });
            }
          })
          .default(""),
        galleryImages: z
          .array(
            z.object({
              url: z
                .string()
                .trim()
                .superRefine((val, ctx) => {
                  if (!val) {
                    return;
                  }
                  if (val.startsWith("/uploads/")) {
                    return;
                  }
                  try {
                    new URL(val);
                  } catch {
                    ctx.addIssue({
                      code: z.ZodIssueCode.custom,
                      message: "Enter a valid URL or upload an image",
                    });
                  }
                })
                .default(""),
            })
          )
          .max(12, "You can add up to 12 gallery images"),
        richDescription: z
          .string()
          .max(20000, "Rich description is too long")
          .default(""),
        featured: z.boolean().default(false),
        inStock: z.boolean().default(true),
        highlights: z
          .string()
          .max(800, "Highlights should be under 800 characters")
          .optional()
          .default(""),
        variants: z
          .array(
            z.object({
              label: z
                .string()
                .trim()
                .min(1, "Variant name cannot be empty")
                .max(120),
              price: z.coerce
                .number()
                .min(0, "Variant price must be 0 or greater"),
              discountedPrice: z
                .coerce.number()
                .min(0, "Discounted price must be 0 or greater")
                .optional()
                .default(0),
              description: z
                .string()
                .trim()
                .max(5000, "Variant description is too long")
                .optional()
                .default(""),
              imageUrl: z
                .string()
                .trim()
                .refine(validateUrlOrUpload, "Enter a valid image URL or upload")
                .optional()
                .default(""),
              galleryImages: z
                .array(
                  z
                    .string()
                    .trim()
                    .refine(validateUrlOrUpload, "Enter a valid image URL or upload")
                )
                .max(12, "You can add up to 12 gallery images per variant")
                .optional()
                .default([]),
              condition: z.enum(productConditions).optional(),
              processorId: z
                .union([
                  z
                    .string()
                    .trim()
                    .regex(objectIdRegex, "Select a valid processor"),
                  z.literal(""),
                ])
                .optional()
                .default(""),
              ramId: z
                .union([
                  z
                    .string()
                    .trim()
                    .regex(objectIdRegex, "Select a valid RAM option"),
                  z.literal(""),
                ])
                .optional()
                .default(""),
              storageId: z
                .union([
                  z
                    .string()
                    .trim()
                    .regex(objectIdRegex, "Select a valid storage option"),
                  z.literal(""),
                ])
                .optional()
                .default(""),
              graphicsId: z
                .union([
                  z
                    .string()
                    .trim()
                    .regex(objectIdRegex, "Select a valid graphics option"),
                  z.literal(""),
                ])
                .optional()
                .default(""),
              color: z
                .string()
                .trim()
                .max(80, "Colour names should be under 80 characters")
                .optional()
                .default(""),
            })
          )
          .max(30, "You can add up to 30 variants")
          .optional()
          .default([]),
        colors: z
          .array(
            z
              .string()
              .trim()
              .min(1, "Colour name cannot be empty")
              .max(80, "Colour names should be under 80 characters")
          )
          .max(12, "You can add up to 12 colours")
          .optional()
          .default([]),
      }),
    []
  );

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? "",
      category: product?.category ?? "",
      description: product?.description ?? "",
      price: product?.price ?? 0,
      discountedPrice: product?.discountedPrice ?? product?.price ?? 0,
      condition: product?.condition ?? "refurbished",
      companyId: product?.company?.id ?? "",
      companySubMasterId: product?.companySubmaster?.id ?? "",
      processorId: product?.processor?.id ?? "",
      processorSubMasterId: product?.processorSubmaster?.id ?? "",
      ramId: product?.ram?.id ?? "",
      ramSubMasterId: product?.ramSubmaster?.id ?? "",
      storageId: product?.storage?.id ?? "",
      storageSubMasterId: product?.storageSubmaster?.id ?? "",
      graphicsId: product?.graphics?.id ?? "",
      graphicsSubMasterId: product?.graphicsSubmaster?.id ?? "",
      osId: product?.os?.id ?? "",
      osSubMasterId: product?.osSubmaster?.id ?? "",
      imageUrl: product?.imageUrl ?? "",
      galleryImages:
        product?.galleryImages?.map((url) => ({ url }))?.slice(0, 12) ?? [],
      richDescription: product?.richDescription ?? "",
      featured: product?.featured ?? false,
      inStock: product?.inStock ?? true,
      highlights: product?.highlights?.join("\n") ?? "",
      variants:
        product?.variants
          ?.filter((variant) => !variant.isDefault)
          ?.map((variant) => ({
            label: variant.label,
            price: variant.price,
            discountedPrice: variant.discountedPrice ?? variant.price,
            description: variant.description ?? "",
            imageUrl: variant.imageUrl ?? "",
            galleryImages: variant.galleryImages ?? [],
            processorId: variant.processor?.id ?? "",
            ramId: variant.ram?.id ?? "",
            storageId: variant.storage?.id ?? "",
            graphicsId: variant.graphics?.id ?? "",
            color: variant.color ?? "",
            condition: variant.condition ?? product?.condition ?? "refurbished",
          })) ?? [],
      colors: product?.colors ?? [],
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    control,
    formState: { errors, isSubmitting },
    clearErrors,
  } = form;

  const selectedCategory = useWatch({ control, name: "category" });
  const selectedCompanyId = useWatch({ control, name: "companyId" });
  const selectedProcessorId = useWatch({ control, name: "processorId" });
  const selectedRamId = useWatch({ control, name: "ramId" });
  const selectedStorageId = useWatch({ control, name: "storageId" });
  const selectedGraphicsId = useWatch({ control, name: "graphicsId" });
  const selectedOsId = useWatch({ control, name: "osId" });
  const nameValue = useWatch({ control, name: "name" });
  const availableColors = useWatch({ control, name: "colors" }) ?? [];
  const selectedCondition = useWatch({ control, name: "condition" });
  const companySubMasterId = useWatch({ control, name: "companySubMasterId" });
  const processorSubMasterId = useWatch({ control, name: "processorSubMasterId" });
  const ramSubMasterId = useWatch({ control, name: "ramSubMasterId" });
  const storageSubMasterId = useWatch({ control, name: "storageSubMasterId" });
  const graphicsSubMasterId = useWatch({ control, name: "graphicsSubMasterId" });
  const osSubMasterId = useWatch({ control, name: "osSubMasterId" });

  const {
    fields: galleryFields,
    append: appendGallery,
    remove: removeGallery,
  } = useFieldArray({
    control,
    name: "galleryImages",
  });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control,
    name: "variants",
  });
  const [variantSelections, setVariantSelections] = useState<
    Record<string, VariantSelection>
  >({});
  const variantValues = useWatch({ control, name: "variants" }) ?? [];

  const masterNameLookup = useMemo(() => {
    const lookup: Record<MasterOptionType, Record<string, string>> = {
      company: {},
      processor: {},
      ram: {},
      storage: {},
      graphics: {},
      os: {},
    };
    (Object.keys(masters) as MasterOptionType[]).forEach((type) => {
      masters[type].forEach((option) => {
        lookup[type][option.id] = option.name;
      });
    });
    return lookup;
  }, [masters]);

  const subMasterLabelLookup = useMemo(() => {
    const optionMap = new Map<string, SubMasterOptionSummary>();
    (Object.values(subMasters) as Record<string, SubMasterOptionSummary[]>[]).forEach(
      (byMaster) => {
        Object.values(byMaster).forEach((list) => {
          list.forEach((option) => optionMap.set(option.id, option));
        });
      }
    );
    const cache = new Map<string, string>();
    const buildPath = (id: string): string => {
      if (cache.has(id)) return cache.get(id)!;
      const option = optionMap.get(id);
      if (!option) return "";
      const parts = [option.name];
      const seen = new Set<string>();
      let currentParent = option.parentId ?? null;
      while (currentParent) {
        if (seen.has(currentParent)) break;
        seen.add(currentParent);
        const parent = optionMap.get(currentParent);
        if (!parent) break;
        parts.unshift(parent.name);
        currentParent = parent.parentId ?? null;
      }
      parts.unshift(option.masterName);
      const label = parts.filter(Boolean).join(" / ");
      cache.set(id, label);
      return label;
    };
    return buildPath;
  }, [subMasters]);

  const getSubMasterOptions = (
    type: MasterOptionType,
    masterId?: string | null
  ): SubMasterOptionSummary[] => {
    if (!masterId) return [];
    return subMasters[type]?.[masterId] ?? [];
  };

  const getChildSubMasters = (
    type: MasterOptionType,
    masterId: string | undefined | null,
    parentId: string | undefined | null
  ): SubMasterOptionSummary[] => {
    if (!masterId || !parentId) return [];
    return getSubMasterOptions(type, masterId).filter((option) => option.parentId === parentId);
  };

  function buildVariantDefaults(): ProductFormValues["variants"][number] {
    const basePrice = Number(getValues("price"));
    const baseDiscount = Number(getValues("discountedPrice"));
    const normalizedBasePrice = Number.isFinite(basePrice) ? basePrice : product?.price ?? 0;
    const normalizedBaseDiscounted =
      Number.isFinite(baseDiscount) && baseDiscount > 0
        ? baseDiscount
        : normalizedBasePrice;
    const selection: VariantSelection = {
      processorId: selectedProcessorId || undefined,
      ramId: selectedRamId || undefined,
      storageId: selectedStorageId || undefined,
      graphicsId: selectedGraphicsId || undefined,
    };
    const label = composeVariantLabel(selection);
    return {
      label,
      price: normalizedBasePrice,
      discountedPrice: normalizedBaseDiscounted,
      description: "",
      imageUrl: "",
      galleryImages: [],
      processorId: selection.processorId ?? "",
      ramId: selection.ramId ?? "",
      storageId: selection.storageId ?? "",
      graphicsId: selection.graphicsId ?? "",
      color: selection.color ?? "",
      condition: selectedCondition ?? product?.condition ?? "refurbished",
    };
  }

  const resolveSubMasterLeaf = useCallback(
    (id?: string | null) => {
      if (!id) return null;
      const label = subMasterLabelLookup(id);
      const leaf = label?.split("/").pop()?.trim();
      return (leaf || label || "").trim() || null;
    },
    [subMasterLabelLookup]
  );

  const buildFullName = useCallback(
    (
      options: {
        selection?: VariantSelection;
        condition?: ProductFormValues["condition"];
        colorOverride?: string | null;
      } = {}
    ) => {
      const selection = options.selection ?? {};
      const conditionValue =
        options.condition ?? selectedCondition ?? product?.condition ?? "refurbished";

      const companyName =
        masterNameLookup.company[selectedCompanyId ?? ""]?.trim() || "";
      const subCompanyName = resolveSubMasterLeaf(companySubMasterId);

      const processorName =
        masterNameLookup.processor[
          selection.processorId ?? selectedProcessorId ?? ""
        ]?.trim() || "";
      const processorSubName = resolveSubMasterLeaf(processorSubMasterId);
      const ramName =
        masterNameLookup.ram[selection.ramId ?? selectedRamId ?? ""]?.trim() ||
        "";
      const ramSubName = resolveSubMasterLeaf(ramSubMasterId);
      const storageName =
        masterNameLookup.storage[
          selection.storageId ?? selectedStorageId ?? ""
        ]?.trim() || "";
      const storageSubName = resolveSubMasterLeaf(storageSubMasterId);
      const osName =
        masterNameLookup.os[selectedOsId ?? ""]?.trim() ||
        "";
      const osSubName = resolveSubMasterLeaf(osSubMasterId);
      const colorName =
        options.colorOverride ??
        selection.color?.trim() ??
        availableColors[0]?.trim() ??
        "";
      const conditionLabel = conditionValue
        ? conditionLabels[conditionValue] ?? conditionValue
        : "";

      const specParts = [
        processorSubName || processorName,
        ramSubName || ramName,
        storageSubName || storageName,
        osSubName || osName,
        colorName,
        conditionLabel,
      ].filter((part): part is string => Boolean(part));

      const prefix =
        [companyName, subCompanyName].filter(Boolean).join(" ").trim() ||
        selectedCategory?.trim() ||
        "Product";

      const nameParts = [prefix, ...specParts].filter(Boolean);

      return nameParts.join(" | ").trim();
    },
    [
      availableColors,
      companySubMasterId,
      masterNameLookup,
      product?.condition,
      ramSubMasterId,
      resolveSubMasterLeaf,
      selectedCategory,
      selectedCompanyId,
      selectedCondition,
      selectedOsId,
      selectedProcessorId,
      selectedRamId,
      selectedStorageId,
      storageSubMasterId,
      osSubMasterId,
      processorSubMasterId,
    ]
  );

  const suggestedName = useMemo(
    () => buildFullName(),
    [buildFullName]
  );

  const lastSuggestedRef = useRef(suggestedName);

  useEffect(() => {
    const trimmedName = typeof nameValue === "string" ? nameValue.trim() : "";
    const prevSuggested = lastSuggestedRef.current ?? "";
    const isUsingSuggested = trimmedName.length === 0 || trimmedName === prevSuggested;

    if (isUsingSuggested && suggestedName) {
      setValue("name", suggestedName as ProductFormValues["name"], {
        shouldDirty: false,
      });
      clearErrors("name");
      lastSuggestedRef.current = suggestedName;
      return;
    }
    lastSuggestedRef.current = suggestedName;
  }, [nameValue, suggestedName, setValue, clearErrors]);

  function syncVariantFields(index: number, selection: VariantSelection) {
    setValue(
      `variants.${index}.processorId`,
      (selection.processorId ??
        "") as ProductFormValues["variants"][number]["processorId"],
      { shouldDirty: true }
    );
    setValue(
      `variants.${index}.ramId`,
      (selection.ramId ?? "") as ProductFormValues["variants"][number]["ramId"],
      { shouldDirty: true }
    );
    setValue(
      `variants.${index}.storageId`,
      (selection.storageId ??
        "") as ProductFormValues["variants"][number]["storageId"],
      { shouldDirty: true }
    );
    setValue(
      `variants.${index}.graphicsId`,
      (selection.graphicsId ??
        "") as ProductFormValues["variants"][number]["graphicsId"],
      { shouldDirty: true }
    );
    setValue(
      `variants.${index}.color`,
      (selection.color ?? "") as ProductFormValues["variants"][number]["color"],
      { shouldDirty: true }
    );
  }

  const composeVariantLabel = useCallback(
    (
      selection: VariantSelection,
      condition?: ProductFormValues["condition"],
      colorOverride?: string | null
    ) => buildFullName({ selection, condition, colorOverride }),
    [buildFullName]
  );

  function deriveVariantSelectionFromLabel(label: string): VariantSelection {
    const parts = label
      .split(/[|•]/)
      .map((item) => item.trim())
      .filter(Boolean);

    const selection: VariantSelection = {};
    const remaining: string[] = [];

    parts.forEach((part) => {
      const matchProcessor =
        !selection.processorId &&
        masters.processor.find(
          (option) => option.name.toLowerCase() === part.toLowerCase()
        );
      if (matchProcessor) {
        selection.processorId = matchProcessor.id;
        return;
      }

      const matchRam =
        !selection.ramId &&
        masters.ram.find(
          (option) => option.name.toLowerCase() === part.toLowerCase()
        );
      if (matchRam) {
        selection.ramId = matchRam.id;
        return;
      }

      const matchStorage =
        !selection.storageId &&
        masters.storage.find(
          (option) => option.name.toLowerCase() === part.toLowerCase()
        );
      if (matchStorage) {
        selection.storageId = matchStorage.id;
        return;
      }

      const matchGraphics =
        !selection.graphicsId &&
        masters.graphics.find(
          (option) => option.name.toLowerCase() === part.toLowerCase()
        );
      if (matchGraphics) {
        selection.graphicsId = matchGraphics.id;
        return;
      }

      const matchColor =
        !selection.color &&
        availableColors.some(
          (color) => color.toLowerCase() === part.toLowerCase()
        );
      if (matchColor) {
        selection.color = part;
        return;
      }

      remaining.push(part);
    });

    if (remaining.length > 0) {
      selection.note = remaining.join(" • ");
    }

    return selection;
  }

  useEffect(() => {
    setVariantSelections((prev) => {
      const next: Record<string, VariantSelection> = {};
      let changed = false;
      variantFields.forEach((field, index) => {
        const existing = prev[field.id];
        if (existing) {
          next[field.id] = existing;
          return;
        }
        const formVariant: any = variantValues?.[index];
        const currentLabel = formVariant?.label ?? field.label ?? "";
        const selectionFromValues: VariantSelection = {
          processorId: formVariant?.processorId || undefined,
          ramId: formVariant?.ramId || undefined,
          storageId: formVariant?.storageId || undefined,
          graphicsId: formVariant?.graphicsId || undefined,
          color: formVariant?.color || undefined,
          note: formVariant?.note ?? "",
        };
        const hasExplicitSelection =
          selectionFromValues.processorId ||
          selectionFromValues.ramId ||
          selectionFromValues.storageId ||
          selectionFromValues.graphicsId ||
          selectionFromValues.color;
        const derived = hasExplicitSelection
          ? selectionFromValues
          : deriveVariantSelectionFromLabel(currentLabel);
        next[field.id] = derived;
        changed = true;
      });
      if (Object.keys(prev).length !== Object.keys(next).length) {
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [masters, variantFields, variantValues]);

  function updateVariantSelection(
    fieldId: string,
    index: number,
    patch: Partial<VariantSelection>
  ) {
    setVariantSelections((prev) => {
      const current = prev[fieldId] ?? {
        note: variantValues?.[index]?.label ?? "",
      };
      const nextSelection = { ...current, ...patch };
      const next = { ...prev, [fieldId]: nextSelection };
      const variantCondition = getValues(
        `variants.${index}.condition` as const
      ) as ProductFormValues["condition"];
      const label = composeVariantLabel(nextSelection, variantCondition);
      setValue(`variants.${index}.label`, label, {
        shouldValidate: true,
        shouldDirty: true,
      });
      syncVariantFields(index, nextSelection);
      return next;
    });
  }

  useEffect(() => {
    variantFields.forEach((field, index) => {
      const selection = variantSelections[field.id] ?? {};
      const variantCondition = getValues(
        `variants.${index}.condition` as const
      ) as ProductFormValues["condition"];
      const label = composeVariantLabel(selection, variantCondition);
      const currentLabel = getValues(
        `variants.${index}.label` as const
      ) as string;
      if (label !== currentLabel) {
        setValue(`variants.${index}.label`, label, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    });
  }, [
    composeVariantLabel,
    getValues,
    setValue,
    variantFields,
    variantSelections,
  ]);

  function removeVariantRow(index: number, fieldId: string) {
    removeVariant(index);
    setVariantSelections((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setIsLoadingCategories(true);
      setCategoriesError(null);

      try {
        const response = await fetch("/api/categories");
        if (!response.ok) {
          throw new Error("Failed to load categories");
        }

        const data = await response.json().catch(() => null);
        const fetched: Pick<CategorySummary, "id" | "name">[] = Array.isArray(
          data?.categories
        )
          ? data.categories.filter(
              (item: unknown): item is Pick<CategorySummary, "id" | "name"> =>
                typeof item === "object" &&
                item !== null &&
                typeof (item as CategorySummary).id === "string" &&
                typeof (item as CategorySummary).name === "string"
            )
          : [];

        if (cancelled) {
          return;
        }

        setCategories(fetched);

        const currentCategory = getValues("category");
        const hasCurrentInFetched = fetched.some(
          (category) => category.name === currentCategory
        );
        const firstCategory = fetched[0];
        if ((!currentCategory || !hasCurrentInFetched) && firstCategory) {
          setValue("category", firstCategory.name, { shouldValidate: true });
        }
      } catch (error) {
        console.error(error);
        if (cancelled) {
          return;
        }
        setCategories([]);
        setCategoriesError(
          "Unable to load categories. Please refresh and try again."
        );
      } finally {
        if (!cancelled) {
          setIsLoadingCategories(false);
        }
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, [getValues, setValue]);

  useEffect(() => {
    let cancelled = false;

    async function loadSubMasters() {
      setIsLoadingSubMasters(true);
      setSubMastersError(null);

      try {
        const response = await fetch("/api/submasters");
        if (!response.ok) {
          throw new Error("Failed to load submaster options");
        }

        const data = await response.json().catch(() => null);
        const rawSubMasters = (data?.submasters ?? {}) as Partial<
          Record<MasterOptionType, unknown>
        >;
        const parsed = createEmptySubMasters();

        (Object.keys(parsed) as MasterOptionType[]).forEach((type) => {
          const items = Array.isArray(rawSubMasters[type])
            ? (rawSubMasters[type] as unknown[]).filter(
                (item): item is SubMasterOptionSummary =>
                  typeof (item as SubMasterOptionSummary)?.id === "string" &&
                  typeof (item as SubMasterOptionSummary)?.name === "string" &&
                  typeof (item as SubMasterOptionSummary)?.masterId === "string"
              )
            : [];
          items.forEach((item) => {
            if (!parsed[type][item.masterId]) {
              parsed[type][item.masterId] = [];
            }
            parsed[type][item.masterId].push(item);
          });

          Object.values(parsed[type]).forEach((list) =>
            list.sort((a, b) => {
              const orderA = typeof a.sortOrder === "number" ? a.sortOrder : 0;
              const orderB = typeof b.sortOrder === "number" ? b.sortOrder : 0;
              if (orderA !== orderB) {
                return orderA - orderB;
              }
              return a.name.localeCompare(b.name);
            })
          );
        });

        const productSubMasterNames: Partial<
          Record<keyof typeof subMasterFieldMap, string | undefined>
        > = {
          companySubMasterId: product?.companySubmaster?.name,
          processorSubMasterId: product?.processorSubmaster?.name,
          ramSubMasterId: product?.ramSubmaster?.name,
          storageSubMasterId: product?.storageSubmaster?.name,
          graphicsSubMasterId: product?.graphicsSubmaster?.name,
          osSubMasterId: product?.osSubmaster?.name,
        };

        const productMasterNames: Partial<
          Record<MasterOptionType, string | undefined>
        > = {
          company: product?.company?.name,
          processor: product?.processor?.name,
          ram: product?.ram?.name,
          storage: product?.storage?.name,
          graphics: product?.graphics?.name,
          os: product?.os?.name,
        };

        (
          Object.keys(subMasterFieldMap) as Array<
            keyof typeof subMasterFieldMap
          >
        ).forEach((field) => {
          const selected = getValues(field as keyof ProductFormValues);
          const parentField = subMasterParentFieldMap[field];
          const parentId: any = getValues(
            parentField as keyof ProductFormValues
          );
          if (typeof selected !== "string" || selected.length === 0) {
            return;
          }
          const type = subMasterFieldMap[field];
          if (!parentId) {
            return;
          }
          const exists =
            parsed[type][parentId]?.some((option) => option.id === selected) ??
            false;
          if (!exists) {
            parsed[type][parentId] = parsed[type][parentId] ?? [];
            parsed[type][parentId].push({
              id: selected,
              masterId: parentId,
              masterName: productMasterNames[type] ?? "Current master",
              masterType: type,
              name: productSubMasterNames[field] ?? "Current submaster",
            });
          }
        });

        if (cancelled) {
          return;
        }

        setSubMasters(parsed);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setSubMasters(createEmptySubMasters());
          setSubMastersError(
            "Unable to load submaster options. Please refresh."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSubMasters(false);
        }
      }
    }

    void loadSubMasters();

    return () => {
      cancelled = true;
    };
  }, [getValues, product]);

  useEffect(() => {
    let cancelled = false;

    async function loadMasters() {
      setIsLoadingMasters(true);
      setMastersError(null);

      try {
        const response = await fetch(
          "/api/masters?types=company,processor,ram,storage,graphics,os"
        );
        if (!response.ok) {
          throw new Error("Failed to load master options");
        }

        const data = await response.json().catch(() => null);
        const rawMasters = (data?.masters ?? {}) as Partial<
          Record<MasterOptionType, unknown>
        >;
        const parsed = createEmptyMasters();

        (Object.keys(parsed) as MasterOptionType[]).forEach((type) => {
          const items = Array.isArray(rawMasters[type])
            ? (rawMasters[type] as unknown[]).filter(
                (item): item is MasterOptionSummary =>
                  typeof (item as MasterOptionSummary)?.id === "string" &&
                  typeof (item as MasterOptionSummary)?.name === "string"
              )
            : [];
          parsed[type] = items;
        });

        (
          Object.keys(masterFieldMap) as Array<keyof typeof masterFieldMap>
        ).forEach((field) => {
          const selected = getValues(field as keyof ProductFormValues);
          if (typeof selected !== "string" || selected.length === 0) {
            return;
          }
          const type = masterFieldMap[field];
          const exists = parsed[type].some((option) => option.id === selected);
          if (!exists) {
            parsed[type] = [
              ...parsed[type],
              { id: selected, name: "Current selection", type },
            ];
          }
        });

        if (cancelled) {
          return;
        }

        setMasters(parsed);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setMasters(createEmptyMasters());
          setMastersError("Unable to load master options. Please refresh.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMasters(false);
        }
      }
    }

    void loadMasters();

    return () => {
      cancelled = true;
    };
  }, [getValues]);

  useEffect(() => {
    const pairs: Array<{
      type: MasterOptionType;
      masterId?: string;
      field: keyof Pick<
        ProductFormValues,
        | "companySubMasterId"
        | "processorSubMasterId"
        | "ramSubMasterId"
        | "storageSubMasterId"
        | "graphicsSubMasterId"
        | "osSubMasterId"
      >;
    }> = [
      {
        type: "company",
        masterId: selectedCompanyId,
        field: "companySubMasterId",
      },
      {
        type: "processor",
        masterId: selectedProcessorId,
        field: "processorSubMasterId",
      },
      { type: "ram", masterId: selectedRamId, field: "ramSubMasterId" },
      {
        type: "storage",
        masterId: selectedStorageId,
        field: "storageSubMasterId",
      },
      {
        type: "graphics",
        masterId: selectedGraphicsId,
        field: "graphicsSubMasterId",
      },
      { type: "os", masterId: selectedOsId, field: "osSubMasterId" },
    ];

    if (isLoadingSubMasters) {
      return;
    }

    pairs.forEach(({ type, masterId, field }) => {
      const current = getValues(field) as string | undefined;
      const options = masterId ? subMasters[type][masterId] ?? [] : [];
      if (!masterId || options.length === 0) {
        if (current) {
          setValue(field, "" as ProductFormValues[typeof field], {
            shouldValidate: true,
          });
        }
        return;
      }
      const exists = options.some((option) => option.id === current);
      if (current && !exists) {
        setValue(field, "" as ProductFormValues[typeof field], {
          shouldValidate: true,
        });
      }
    });
  }, [
    getValues,
    selectedCompanyId,
    selectedProcessorId,
    selectedRamId,
    selectedStorageId,
    selectedGraphicsId,
    selectedOsId,
    setValue,
    subMasters,
    isLoadingSubMasters,
  ]);

  const submitHandler = handleSubmit(async (values) => {
    setServerError(null);

    const highlights = values.highlights
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (highlights.length > MAX_PRODUCT_HIGHLIGHTS) {
      setServerError(`You can add up to ${MAX_PRODUCT_HIGHLIGHTS} highlights.`);
      return;
    }

    const basePrice = Number.isFinite(values.price) ? values.price : 0;
    const baseDiscountedPrice =
      Number.isFinite(values.discountedPrice) && values.discountedPrice > 0
        ? values.discountedPrice
        : basePrice;
    const baseHasDiscount = baseDiscountedPrice < basePrice;
    const effectiveBasePrice = baseHasDiscount ? baseDiscountedPrice : basePrice;

    const rawVariants = Array.isArray(values.variants) ? values.variants : [];
    const variantPayloads = variantFields.map((field, index) => {
      const variant = rawVariants[index] ?? {};
      const selection = variantSelections[field.id] ?? {};
      const price = Number(variant?.price);
      const discountedPriceValue = Number((variant as any)?.discountedPrice);
      const hasVariantPrice = Number.isFinite(price);
      const normalizedPrice = hasVariantPrice ? price : basePrice;
      const discountedPrice =
        Number.isFinite(discountedPriceValue) && discountedPriceValue > 0
          ? discountedPriceValue
          : hasVariantPrice
          ? normalizedPrice
          : baseDiscountedPrice;
      const hasVariantDiscount = discountedPrice < normalizedPrice;
      const effectivePrice = hasVariantDiscount ? discountedPrice : normalizedPrice;
      const originalPrice = Number.isFinite(normalizedPrice) ? normalizedPrice : 0;
      const color =
        typeof selection.color === "string" && selection.color.trim().length > 0
          ? selection.color.trim()
          : typeof variant?.color === "string" && variant.color.trim().length > 0
          ? variant.color.trim()
          : undefined;
      const condition =
        productConditions.includes((variant as any)?.condition)
          ? ((variant as any)?.condition as ProductFormValues["variants"][number]["condition"])
          : values.condition;
      const variantGallery =
        Array.isArray((variant as any)?.galleryImages) && (variant as any).galleryImages.length > 0
          ? (variant as any).galleryImages
          : [];
      const normalizedVariantGallery = variantGallery
        .map((entry: any) =>
          typeof entry === "string"
            ? entry.trim()
            : typeof entry?.url === "string"
            ? entry.url.trim()
            : ""
        )
        .filter((url: string, idx: number, arr: string[]) => url.length > 0 && arr.indexOf(url) === idx)
        .slice(0, 12);
      return {
        label: (variant?.label ?? "").trim(),
        price: Number.isFinite(effectivePrice) ? effectivePrice : 0,
        originalPrice: Number.isFinite(originalPrice) ? originalPrice : 0,
        discountedPrice: Number.isFinite(discountedPrice) ? discountedPrice : 0,
        onSale: hasVariantDiscount,
        description: typeof variant?.description === "string" ? variant.description.trim() : "",
        imageUrl: typeof variant?.imageUrl === "string" ? variant.imageUrl.trim() : "",
        galleryImages: normalizedVariantGallery,
        processorId: selection.processorId || variant?.processorId || undefined,
        ramId: selection.ramId || variant?.ramId || undefined,
        storageId: selection.storageId || variant?.storageId || undefined,
        graphicsId: selection.graphicsId || variant?.graphicsId || undefined,
        color,
        condition,
      };
    });

    const variantEntries = variantPayloads
      .map((payload, index) => ({
        payload,
        raw: rawVariants[index] ?? {},
      }))
      .filter((entry) => entry.payload.label.length > 0 && entry.payload.price >= 0);

    const seenVariantLabels = new Set<string>();
    const uniqueEntries = variantEntries.filter(({ payload }) => {
      const key = payload.label.toLowerCase();
      if (seenVariantLabels.has(key)) {
        return false;
      }
      seenVariantLabels.add(key);
      return true;
    });

    if (uniqueEntries.length > 30) {
      setServerError("You can add up to 30 variants.");
      return;
    }

    if (uniqueEntries.length !== rawVariants.length) {
      setValue(
        "variants",
        uniqueEntries.map((entry) => entry.raw) as ProductFormValues["variants"],
        {
          shouldValidate: true,
        }
      );
    }

    const uniqueVariants = uniqueEntries.map((entry) => entry.payload);

    const rawColors = Array.isArray(values.colors) ? values.colors : [];
    const normalizedColors = rawColors
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const uniqueColors = normalizedColors.filter(
      (item, index) =>
        normalizedColors.findIndex(
          (candidate) => candidate.toLowerCase() === item.toLowerCase()
        ) === index
    );

    if (uniqueColors.length !== normalizedColors.length) {
      setValue("colors", uniqueColors, { shouldValidate: true });
    }

    if (normalizedColors.length > 12) {
      setServerError("You can add up to 12 colours.");
      return;
    }

    const colors = uniqueColors.slice(0, 1);

    const galleryImages = values.galleryImages
      .map((entry) => entry.url.trim())
      .filter((url, index, arr) => url.length > 0 && arr.indexOf(url) === index)
      .slice(0, 12);

    const payload = {
      name: values.name,
      category: values.category,
      description: values.description,
      price: effectiveBasePrice,
      originalPrice: Number.isFinite(basePrice) ? basePrice : effectiveBasePrice,
      discountedPrice: Number.isFinite(baseDiscountedPrice) ? baseDiscountedPrice : effectiveBasePrice,
      onSale: baseHasDiscount,
      condition: values.condition,
      companyId: values.companyId || undefined,
      companySubMasterId: values.companySubMasterId || undefined,
      processorId: values.processorId || undefined,
      processorSubMasterId: values.processorSubMasterId || undefined,
      ramId: values.ramId || undefined,
      ramSubMasterId: values.ramSubMasterId || undefined,
      storageId: values.storageId || undefined,
      storageSubMasterId: values.storageSubMasterId || undefined,
      graphicsId: values.graphicsId || undefined,
      graphicsSubMasterId: values.graphicsSubMasterId || undefined,
      osId: values.osId || undefined,
      osSubMasterId: values.osSubMasterId || undefined,
      imageUrl: values.imageUrl,
      galleryImages,
      richDescription: values.richDescription.trim(),
      featured: values.featured,
      inStock: values.inStock,
      highlights,
      variants: uniqueVariants,
      colors,
    };

    try {
      const endpoint =
        mode === "create" ? "/api/products" : `/api/products/${product?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.error
          ? typeof data.error === "string"
            ? data.error
            : Object.values<string[]>(data.error)[0]?.[0] ??
              "Unable to save product"
          : "Unable to save product";
        setServerError(message);
        toast.error(message);
        return;
      }

      toast.success(mode === "create" ? "Product created" : "Product updated");
      if (mode === "create") {
        reset({
          name: "",
          category: "",
          description: "",
          price: 0,
          discountedPrice: 0,
          condition: "refurbished",
          companyId: "",
          companySubMasterId: "",
          processorId: "",
          processorSubMasterId: "",
          ramId: "",
          ramSubMasterId: "",
          storageId: "",
          storageSubMasterId: "",
          graphicsId: "",
          graphicsSubMasterId: "",
          osId: "",
          osSubMasterId: "",
          imageUrl: "",
          galleryImages: [],
          richDescription: "",
          featured: false,
          inStock: true,
          highlights: "",
          variants: [],
          colors: [],
        });
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

  const title =
    mode === "create"
      ? ""
      : `Update ${product?.name ?? "product"}`;

  const companySubOptions =
    selectedCompanyId && subMasters.company[selectedCompanyId]
      ? subMasters.company[selectedCompanyId]
      : [];
  const processorSubOptions =
    selectedProcessorId && subMasters.processor[selectedProcessorId]
      ? subMasters.processor[selectedProcessorId]
      : [];
  const ramSubOptions =
    selectedRamId && subMasters.ram[selectedRamId]
      ? subMasters.ram[selectedRamId]
      : [];
  const storageSubOptions =
    selectedStorageId && subMasters.storage[selectedStorageId]
      ? subMasters.storage[selectedStorageId]
      : [];
  const graphicsSubOptions =
    selectedGraphicsId && subMasters.graphics[selectedGraphicsId]
      ? subMasters.graphics[selectedGraphicsId]
      : [];
  const osSubOptions =
    selectedOsId && subMasters.os[selectedOsId]
      ? subMasters.os[selectedOsId]
      : [];

  async function uploadImageFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/uploads/images", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error ?? "Upload failed");
    }

    const data = (await response.json()) as { url: string };
    return data.url;
  }

  async function handlePrimaryFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      setIsUploadingPrimary(true);
      const url = await uploadImageFile(file);
      setValue("imageUrl", url, { shouldValidate: true });
      toast.success("Primary image uploaded");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploadingPrimary(false);
      event.target.value = "";
    }
  }

  async function handleGalleryFileChange(
    event: ChangeEvent<HTMLInputElement>,
    index: number
  ) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      setGalleryUploadingIndex(index);
      const url = await uploadImageFile(file);
      setValue(`galleryImages.${index}.url`, url, { shouldValidate: true });
      toast.success("Gallery image uploaded");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setGalleryUploadingIndex(null);
      event.target.value = "";
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-foreground">
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Fill in product details to showcase laptops and electronics in the
          storefront.
        </p>
      </CardHeader>
      <form onSubmit={submitHandler} className="space-y-6">
        <CardContent className="space-y-10">
          <section className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product name</Label>
                  <Input
                    id="name"
                    placeholder="ThinkPad X1 Carbon"
                    {...register("name")}
                  />
                  {errors.name ? (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.name.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-3 rounded-lg border border-slate-200 bg-white/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="imageUrl">Primary image</Label>
                      <p className="text-xs text-muted-foreground">
                        Shown on listing cards and as the default hero image.
                        Use a crisp 1200×900px photo.
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {isUploadingPrimary
                        ? "Uploading image…"
                        : "Paste a URL or upload"}
                    </span>
                  </div>
                  <Input
                    id="imageUrl"
                    placeholder="https://images.example.com/device.jpg"
                    {...register("imageUrl")}
                  />
                  {errors.imageUrl ? (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.imageUrl.message}
                    </p>
                  ) : null}
                  <div className="flex items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePrimaryFileChange}
                        disabled={isUploadingPrimary}
                      />
                      <span className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                        {isUploadingPrimary ? "Uploading…" : "Choose file"}
                      </span>
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {isUploadingPrimary
                        ? "Uploading image…"
                        : "Upload directly from your computer."}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-3 rounded-lg border border-slate-200 bg-secondary/50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <Label>Gallery images</Label>
                    <p className="text-xs text-muted-foreground">
                      Add alternate angles or lifestyle shots. The first three
                      sit under the hero image.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendGallery({ url: "" })}
                    disabled={galleryFields.length >= 12}
                  >
                    Add image
                  </Button>
                </div>
                <div className="space-y-3">
                  {galleryFields.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No gallery media yet.
                    </p>
                  ) : null}
                  {galleryFields.map((field, index) => (
                    <div key={field.id} className="space-y-1">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center">
                        <Input
                          placeholder="https://images.example.com/gallery.jpg"
                          defaultValue={field.url ?? ""}
                          {...register(`galleryImages.${index}.url`)}
                          aria-invalid={Boolean(
                            errors.galleryImages?.[index]?.url
                          )}
                        />
                        <div className="flex items-center gap-2">
                          <label className="inline-flex cursor-pointer items-center">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) =>
                                handleGalleryFileChange(event, index)
                              }
                              disabled={galleryUploadingIndex === index}
                            />
                            <span className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                              {galleryUploadingIndex === index
                                ? "Uploading…"
                                : "Upload"}
                            </span>
                          </label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeGallery(index)}
                            aria-label="Remove gallery image"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                      {errors.galleryImages?.[index]?.url?.message ? (
                        <p className="text-sm text-destructive" role="alert">
                          {errors.galleryImages[index]?.url?.message}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <select
                      id="category"
                      name={field.name}
                      ref={field.ref}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                      disabled={isLoadingCategories || categories.length === 0}
                      value={field.value ?? ""}
                      onChange={(event) => {
                        field.onChange(event.target.value);
                        clearErrors("category");
                      }}
                      onBlur={field.onBlur}
                    >
                      {isLoadingCategories ? (
                        <option value="">Loading categories...</option>
                      ) : categories.length > 0 ? (
                        categories.map((category) => (
                          <option key={category.id} value={category.name}>
                            {category.name}
                          </option>
                        ))
                      ) : (
                        <option value="">No categories available</option>
                      )}
                    </select>
                  )}
                />
                {errors.category ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.category.message}
                  </p>
                ) : null}
                {categoriesError ? (
                  <p className="text-xs text-destructive" role="alert">
                    {categoriesError}
                  </p>
                ) : null}
                {!isLoadingCategories &&
                categories.length === 0 &&
                !categoriesError ? (
                  <p className="text-xs text-muted-foreground">
                    Create categories first so products can be assigned
                    correctly.
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("price", { valueAsNumber: true })}
                />
                {errors.price ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.price.message}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Base price used when no configuration override is selected; discounting is applied automatically.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <select
                  id="condition"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  {...register("condition")}
                >
                  {productConditions.map((condition) => (
                    <option key={condition} value={condition}>
                      {conditionLabels[condition]}
                    </option>
                  ))}
                </select>
                {errors.condition ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.condition.message}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="discountedPrice">Discounted price (₹)</Label>
                <Input
                  id="discountedPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("discountedPrice", { valueAsNumber: true })}
                />
                {errors.discountedPrice ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.discountedPrice.message}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  If lower than price, the product is marked on sale automatically.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex flex-1 items-center gap-3 rounded-lg border border-input bg-secondary/50 px-4 py-3 text-sm font-medium text-foreground shadow-sm">
                <input
                  type="checkbox"
                  className="size-4 rounded border border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  {...register("featured")}
                />
                Highlight on landing page
              </label>
              <label className="flex flex-1 items-center gap-3 rounded-lg border border-input bg-secondary/50 px-4 py-3 text-sm font-medium text-foreground shadow-sm">
                <input
                  type="checkbox"
                  className="size-4 rounded border border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  {...register("inStock")}
                />
                Available in stock
              </label>
            </div>
          </section>

          <section className="space-y-4">
            <div className="space-y-2 sm:max-w-3xl">
              <Label htmlFor="colors">Colour options</Label>
              <Controller
                control={control}
                name="colors"
                render={({ field, fieldState }) => (
                  <ColorOptionsEditor
                    value={field.value ?? []}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    onClearErrors={() => clearErrors("colors")}
                  />
                )}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Configuration variants</Label>
                  <p className="text-xs text-muted-foreground">
                    Build processor / RAM / storage combinations with their own
                    prices.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendVariant(buildVariantDefaults())}
                  disabled={variantFields.length >= 30}
                >
                  Add option
                </Button>
              </div>
              {variantFields.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No variants added. The base price will be used.
                </p>
              ) : null}
              <div className="space-y-4">
                {variantFields.map((field, index) => {
                  const variantGalleryImages = Array.isArray(
                    variantValues?.[index]?.galleryImages
                  )
                    ? variantValues[index]?.galleryImages ?? []
                    : [];

                  const handleVariantGalleryChange = (
                    urlIndex: number,
                    url: string
                  ) => {
                    const nextImages = [...variantGalleryImages];
                    nextImages[urlIndex] = url;
                    setValue(
                      `variants.${index}.galleryImages`,
                      nextImages as ProductFormValues["variants"][number]["galleryImages"],
                      { shouldDirty: true, shouldValidate: true }
                    );
                  };

                  const handleAddVariantGallery = () => {
                    const nextImages = [...variantGalleryImages, ""];
                    setValue(
                      `variants.${index}.galleryImages`,
                      nextImages as ProductFormValues["variants"][number]["galleryImages"],
                      { shouldDirty: true, shouldValidate: true }
                    );
                  };

                  const handleRemoveVariantGallery = (urlIndex: number) => {
                    const nextImages = [...variantGalleryImages];
                    nextImages.splice(urlIndex, 1);
                    setValue(
                      `variants.${index}.galleryImages`,
                      nextImages as ProductFormValues["variants"][number]["galleryImages"],
                      { shouldDirty: true, shouldValidate: true }
                    );
                  };

                  return (
                    <div
                      key={field.id}
                      className="space-y-4 rounded-xl border border-slate-200 bg-white/70 p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start gap-3">
                        <div className="flex-1 space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-600">
                            Variant name
                          </Label>
                          <Input
                            placeholder="M3 Pro • 16GB • 512GB"
                            defaultValue={field.label ?? ""}
                            {...register(`variants.${index}.label` as const)}
                            aria-invalid={Boolean(
                              errors.variants?.[index]?.label
                            )}
                          />
                          {errors.variants?.[index]?.label?.message ? (
                            <p className="text-xs text-destructive" role="alert">
                              {errors.variants[index]?.label?.message}
                            </p>
                          ) : (
                            <p className="text-[11px] text-muted-foreground">
                              Autogenerated from the selections below - edit if
                              needed.
                            </p>
                          )}
                        </div>
                        <div className="w-full min-w-[180px] space-y-1.5 sm:w-48">
                          <Label className="text-xs font-semibold text-slate-600">
                            Price (₹)
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="48999"
                            defaultValue={field.price ?? product?.price ?? 0}
                            {...register(`variants.${index}.price` as const, {
                              valueAsNumber: true,
                            })}
                            aria-invalid={Boolean(
                              errors.variants?.[index]?.price
                            )}
                          />
                          {errors.variants?.[index]?.price?.message ? (
                            <p className="text-xs text-destructive" role="alert">
                              {errors.variants[index]?.price?.message}
                            </p>
                          ) : null}
                        </div>
                        <div className="w-full min-w-[180px] space-y-1.5 sm:w-48">
                          <Label className="text-xs font-semibold text-slate-600">
                            Discounted price (₹)
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="48999"
                            defaultValue={field.discountedPrice ?? field.price ?? product?.price ?? 0}
                            {...register(`variants.${index}.discountedPrice` as const, {
                              valueAsNumber: true,
                            })}
                            aria-invalid={Boolean(
                              errors.variants?.[index]?.discountedPrice
                            )}
                          />
                          {errors.variants?.[index]?.discountedPrice?.message ? (
                            <p className="text-xs text-destructive" role="alert">
                              {errors.variants[index]?.discountedPrice?.message}
                            </p>
                          ) : null}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeVariantRow(index, field.id)}
                          aria-label="Remove variant option"
                        >
                          ×
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-600">
                            Processor
                          </Label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                            value={
                              variantSelections[field.id]?.processorId ?? ""
                            }
                            onChange={(event) =>
                              updateVariantSelection(field.id, index, {
                                processorId: event.target.value || undefined,
                              })
                            }
                            disabled={isLoadingMasters}
                          >
                            <option value="">Select</option>
                            {masters.processor.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-600">
                            RAM
                          </Label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                            value={variantSelections[field.id]?.ramId ?? ""}
                            onChange={(event) =>
                              updateVariantSelection(field.id, index, {
                                ramId: event.target.value || undefined,
                              })
                            }
                            disabled={isLoadingMasters}
                          >
                            <option value="">Select</option>
                            {masters.ram.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label className="text-xs font-semibold text-slate-600">
                            Storage
                          </Label>
                          <StoragePillSelector
                            options={masters.storage}
                            value={variantSelections[field.id]?.storageId}
                            onChange={(selection) =>
                              updateVariantSelection(field.id, index, {
                                storageId: selection,
                              })
                            }
                            disabled={isLoadingMasters}
                          />
                          <p className="text-[11px] text-muted-foreground">
                            Tap a pill to toggle storage; use Clear if this
                            option has no storage override.
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-600">
                            Graphics (optional)
                          </Label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                            value={
                              variantSelections[field.id]?.graphicsId ?? ""
                            }
                            onChange={(event) =>
                              updateVariantSelection(field.id, index, {
                                graphicsId: event.target.value || undefined,
                              })
                            }
                            disabled={isLoadingMasters}
                          >
                            <option value="">Select</option>
                            {masters.graphics.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-600">
                            Colour (optional)
                          </Label>
                          <ColorOptionsEditor
                            value={
                              variantSelections[field.id]?.color
                                ? [variantSelections[field.id]!.color!]
                                : []
                            }
                            onChange={(colors) => {
                              const color =
                                Array.isArray(colors) && colors.length > 0
                                  ? colors[0]
                                  : undefined;
                              updateVariantSelection(field.id, index, { color });
                            }}
                          />
                          <p className="text-[11px] text-muted-foreground">
                            Add a single colour specific to this variant.
                          </p>
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label className="text-xs font-semibold text-slate-600">
                            Custom note (optional)
                          </Label>
                          <Input
                            placeholder="Add extra details (e.g., FHD display)"
                            value={variantSelections[field.id]?.note ?? ""}
                            onChange={(event) =>
                              updateVariantSelection(field.id, index, {
                                note: event.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label className="text-xs font-semibold text-slate-600">
                            Condition (variant)
                          </Label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                            {...register(`variants.${index}.condition` as const, {
                              onChange: (event) => {
                                const nextCondition = event.target
                                  .value as ProductFormValues["condition"];
                                const selection =
                                  variantSelections[field.id] ?? {};
                                const label = composeVariantLabel(
                                  selection,
                                  nextCondition
                                );
                                setValue(`variants.${index}.label`, label, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                });
                              },
                            })}
                            defaultValue={
                              field.condition ??
                              selectedCondition ??
                              product?.condition ??
                              "refurbished"
                            }
                          >
                            {productConditions.map((condition) => (
                              <option key={condition} value={condition}>
                                {conditionLabels[condition]}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label className="text-xs font-semibold text-slate-600">
                            Variant description (optional)
                          </Label>
                          <Textarea
                            placeholder="Describe this configuration"
                            defaultValue={field.description ?? ""}
                            {...register(
                              `variants.${index}.description` as const
                            )}
                          />
                          {errors.variants?.[index]?.description?.message ? (
                            <p className="text-xs text-destructive" role="alert">
                              {errors.variants[index]?.description?.message}
                            </p>
                          ) : null}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-600">
                            Variant image URL (optional)
                          </Label>
                          <Input
                            placeholder="https://images.example.com/variant.jpg"
                            defaultValue={field.imageUrl ?? ""}
                            {...register(`variants.${index}.imageUrl` as const)}
                          />
                          {errors.variants?.[index]?.imageUrl?.message ? (
                            <p className="text-xs text-destructive" role="alert">
                              {errors.variants[index]?.imageUrl?.message}
                            </p>
                          ) : null}
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs font-semibold text-slate-600">
                                Variant gallery (optional)
                              </Label>
                              <p className="text-[11px] text-muted-foreground">
                                Add up to 12 images for this option.
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleAddVariantGallery}
                              disabled={variantGalleryImages.length >= 12}
                            >
                              Add image
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {variantGalleryImages.length === 0 ? (
                              <p className="text-xs text-muted-foreground">
                                No gallery images yet.
                              </p>
                            ) : (
                              variantGalleryImages.map((url, urlIndex) => (
                                <div
                                  key={`${field.id}-gallery-${urlIndex}`}
                                  className="space-y-1"
                                >
                                  <div className="flex items-center gap-2">
                                    <Input
                                      value={url ?? ""}
                                      placeholder="https://images.example.com/gallery.jpg"
                                      onChange={(event) =>
                                        handleVariantGalleryChange(
                                          urlIndex,
                                          event.target.value
                                        )
                                      }
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        handleRemoveVariantGallery(urlIndex)
                                      }
                                      aria-label="Remove variant gallery image"
                                    >
                                      ×
                                    </Button>
                                  </div>
                                  {errors.variants?.[index]?.galleryImages?.[
                                    urlIndex
                                  ]?.message ? (
                                    <p
                                      className="text-xs text-destructive"
                                      role="alert"
                                    >
                                      {
                                        errors.variants?.[index]
                                          ?.galleryImages?.[urlIndex]?.message
                                      }
                                    </p>
                                  ) : null}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      <input
                        type="hidden"
                        defaultValue={field.processorId ?? ""}
                        {...register(`variants.${index}.processorId` as const)}
                      />
                      <input
                        type="hidden"
                        defaultValue={field.ramId ?? ""}
                        {...register(`variants.${index}.ramId` as const)}
                      />
                      <input
                        type="hidden"
                        defaultValue={field.storageId ?? ""}
                        {...register(`variants.${index}.storageId` as const)}
                      />
                      <input
                        type="hidden"
                        defaultValue={field.graphicsId ?? ""}
                        {...register(`variants.${index}.graphicsId` as const)}
                      />
                      <input
                        type="hidden"
                        defaultValue={field.color ?? ""}
                        {...register(`variants.${index}.color` as const)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Shared attributes
                </p>
                <p className="text-sm text-muted-foreground">
                  Link the product to shared masters for filtering and sorting.
                </p>
              </div>
              {isLoadingMasters || isLoadingSubMasters ? (
                <span className="text-xs text-muted-foreground">
                  Loading...
                </span>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="companyId">{masterTypeLabels.company}</Label>
                <select
                  id="companyId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  disabled={isLoadingMasters}
                  {...register("companyId")}
                >
                  <option value="">Select company</option>
                  {masters.company.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                {errors.companyId ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.companyId.message}
                  </p>
                ) : null}
                {companySubOptions.length > 0 ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="companySubMasterId">
                      Submaster (optional)
                    </Label>
                    <select
                      id="companySubMasterId"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                      disabled={isLoadingSubMasters}
                      {...register("companySubMasterId")}
                    >
                      <option value="">Select submaster</option>
                      {companySubOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {subMasterLabelLookup(option.id) || option.name}
                        </option>
                      ))}
                    </select>
                    {companySubMasterId
                      ? getChildSubMasters("company", selectedCompanyId, companySubMasterId)
                          .length > 0 && (
                          <div className="space-y-1.5">
                            <Label htmlFor="companySubMasterChildId">
                              Child submaster (optional)
                            </Label>
                            <select
                              id="companySubMasterChildId"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                              disabled={isLoadingSubMasters}
                              value={companySubMasterId ?? ""}
                              onChange={(event) =>
                                setValue(
                                  "companySubMasterId",
                                  event.target.value as ProductFormValues["companySubMasterId"],
                                  { shouldValidate: true }
                                )
                              }
                            >
                              <option value={companySubMasterId}>Keep current</option>
                              {getChildSubMasters("company", selectedCompanyId, companySubMasterId).map(
                                (child) => (
                                  <option key={child.id} value={child.id}>
                                    {subMasterLabelLookup(child.id) || child.name}
                                  </option>
                                )
                              )}
                            </select>
                          </div>
                        )
                      : null}
                    {errors.companySubMasterId ? (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.companySubMasterId.message}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="processorId">
                  {masterTypeLabels.processor}
                </Label>
                <select
                  id="processorId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  disabled={isLoadingMasters}
                  {...register("processorId")}
                >
                  <option value="">Select processor</option>
                  {masters.processor.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                {errors.processorId ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.processorId.message}
                  </p>
                ) : null}
                {processorSubOptions.length > 0 ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="processorSubMasterId">
                      Submaster (optional)
                    </Label>
                    <select
                      id="processorSubMasterId"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                      disabled={isLoadingSubMasters}
                      {...register("processorSubMasterId")}
                    >
                      <option value="">Select submaster</option>
                      {processorSubOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {subMasterLabelLookup(option.id) || option.name}
                        </option>
                      ))}
                    </select>
                    {processorSubMasterId
                      ? getChildSubMasters(
                          "processor",
                          selectedProcessorId,
                          processorSubMasterId
                        ).length > 0 && (
                          <div className="space-y-1.5">
                            <Label htmlFor="processorSubMasterChildId">
                              Child submaster (optional)
                            </Label>
                            <select
                              id="processorSubMasterChildId"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                              disabled={isLoadingSubMasters}
                              value={processorSubMasterId ?? ""}
                              onChange={(event) =>
                                setValue(
                                  "processorSubMasterId",
                                  event.target.value as ProductFormValues["processorSubMasterId"],
                                  { shouldValidate: true }
                                )
                              }
                            >
                              <option value={processorSubMasterId}>Keep current</option>
                              {getChildSubMasters(
                                "processor",
                                selectedProcessorId,
                                processorSubMasterId
                              ).map((child) => (
                                <option key={child.id} value={child.id}>
                                  {subMasterLabelLookup(child.id) || child.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )
                      : null}
                    {errors.processorSubMasterId ? (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.processorSubMasterId.message}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ramId">{masterTypeLabels.ram}</Label>
                <select
                  id="ramId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  disabled={isLoadingMasters}
                  {...register("ramId")}
                >
                  <option value="">Select RAM</option>
                  {masters.ram.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                {errors.ramId ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.ramId.message}
                  </p>
                ) : null}
                {ramSubOptions.length > 0 ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="ramSubMasterId">Submaster (optional)</Label>
                    <select
                      id="ramSubMasterId"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                      disabled={isLoadingSubMasters}
                      {...register("ramSubMasterId")}
                    >
                      <option value="">Select submaster</option>
                      {ramSubOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {subMasterLabelLookup(option.id) || option.name}
                        </option>
                      ))}
                    </select>
                    {ramSubMasterId
                      ? getChildSubMasters("ram", selectedRamId, ramSubMasterId).length > 0 && (
                          <div className="space-y-1.5">
                            <Label htmlFor="ramSubMasterChildId">Child submaster (optional)</Label>
                            <select
                              id="ramSubMasterChildId"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                              disabled={isLoadingSubMasters}
                              value={ramSubMasterId ?? ""}
                              onChange={(event) =>
                                setValue(
                                  "ramSubMasterId",
                                  event.target.value as ProductFormValues["ramSubMasterId"],
                                  { shouldValidate: true }
                                )
                              }
                            >
                              <option value={ramSubMasterId}>Keep current</option>
                              {getChildSubMasters("ram", selectedRamId, ramSubMasterId).map((child) => (
                                <option key={child.id} value={child.id}>
                                  {subMasterLabelLookup(child.id) || child.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )
                      : null}
                    {errors.ramSubMasterId ? (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.ramSubMasterId.message}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="storageId">{masterTypeLabels.storage}</Label>
                <select
                  id="storageId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  disabled={isLoadingMasters}
                  {...register("storageId")}
                >
                  <option value="">Select storage</option>
                  {masters.storage.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                {errors.storageId ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.storageId.message}
                  </p>
                ) : null}
                {storageSubOptions.length > 0 ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="storageSubMasterId">
                      Submaster (optional)
                    </Label>
                    <select
                      id="storageSubMasterId"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                      disabled={isLoadingSubMasters}
                      {...register("storageSubMasterId")}
                    >
                      <option value="">Select submaster</option>
                      {storageSubOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {subMasterLabelLookup(option.id) || option.name}
                        </option>
                      ))}
                    </select>
                    {storageSubMasterId
                      ? getChildSubMasters(
                          "storage",
                          selectedStorageId,
                          storageSubMasterId
                        ).length > 0 && (
                          <div className="space-y-1.5">
                            <Label htmlFor="storageSubMasterChildId">
                              Child submaster (optional)
                            </Label>
                            <select
                              id="storageSubMasterChildId"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                              disabled={isLoadingSubMasters}
                              value={storageSubMasterId ?? ""}
                              onChange={(event) =>
                                setValue(
                                  "storageSubMasterId",
                                  event.target.value as ProductFormValues["storageSubMasterId"],
                                  { shouldValidate: true }
                                )
                              }
                            >
                              <option value={storageSubMasterId}>Keep current</option>
                              {getChildSubMasters(
                                "storage",
                                selectedStorageId,
                                storageSubMasterId
                              ).map((child) => (
                                <option key={child.id} value={child.id}>
                                  {subMasterLabelLookup(child.id) || child.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )
                      : null}
                    {errors.storageSubMasterId ? (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.storageSubMasterId.message}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="graphicsId">{masterTypeLabels.graphics}</Label>
                <select
                  id="graphicsId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  disabled={isLoadingMasters}
                  {...register("graphicsId")}
                >
                  <option value="">Select graphics</option>
                  {masters.graphics.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                {errors.graphicsId ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.graphicsId.message}
                  </p>
                ) : null}
                {graphicsSubOptions.length > 0 ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="graphicsSubMasterId">
                      Submaster (optional)
                    </Label>
                    <select
                      id="graphicsSubMasterId"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                      disabled={isLoadingSubMasters}
                      {...register("graphicsSubMasterId")}
                    >
                      <option value="">Select submaster</option>
                      {graphicsSubOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {subMasterLabelLookup(option.id) || option.name}
                        </option>
                      ))}
                    </select>
                    {graphicsSubMasterId
                      ? getChildSubMasters(
                          "graphics",
                          selectedGraphicsId,
                          graphicsSubMasterId
                        ).length > 0 && (
                          <div className="space-y-1.5">
                            <Label htmlFor="graphicsSubMasterChildId">
                              Child submaster (optional)
                            </Label>
                            <select
                              id="graphicsSubMasterChildId"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                              disabled={isLoadingSubMasters}
                              value={graphicsSubMasterId ?? ""}
                              onChange={(event) =>
                                setValue(
                                  "graphicsSubMasterId",
                                  event.target.value as ProductFormValues["graphicsSubMasterId"],
                                  { shouldValidate: true }
                                )
                              }
                            >
                              <option value={graphicsSubMasterId}>Keep current</option>
                              {getChildSubMasters(
                                "graphics",
                                selectedGraphicsId,
                                graphicsSubMasterId
                              ).map((child) => (
                                <option key={child.id} value={child.id}>
                                  {subMasterLabelLookup(child.id) || child.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )
                      : null}
                    {errors.graphicsSubMasterId ? (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.graphicsSubMasterId.message}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="osId">{masterTypeLabels.os}</Label>
                <select
                  id="osId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  disabled={isLoadingMasters}
                  {...register("osId")}
                >
                  <option value="">Select OS</option>
                  {masters.os.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                {errors.osId ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.osId.message}
                  </p>
                ) : null}
                {osSubOptions.length > 0 ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="osSubMasterId">Submaster (optional)</Label>
                    <select
                      id="osSubMasterId"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                      disabled={isLoadingSubMasters}
                      {...register("osSubMasterId")}
                    >
                      <option value="">Select submaster</option>
                      {osSubOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {subMasterLabelLookup(option.id) || option.name}
                        </option>
                      ))}
                    </select>
                    {osSubMasterId
                      ? getChildSubMasters("os", selectedOsId, osSubMasterId).length > 0 && (
                          <div className="space-y-1.5">
                            <Label htmlFor="osSubMasterChildId">
                              Child submaster (optional)
                            </Label>
                            <select
                              id="osSubMasterChildId"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                              disabled={isLoadingSubMasters}
                              value={osSubMasterId ?? ""}
                              onChange={(event) =>
                                setValue(
                                  "osSubMasterId",
                                  event.target.value as ProductFormValues["osSubMasterId"],
                                  { shouldValidate: true }
                                )
                              }
                            >
                              <option value={osSubMasterId}>Keep current</option>
                              {getChildSubMasters("os", selectedOsId, osSubMasterId).map(
                                (child) => (
                                  <option key={child.id} value={child.id}>
                                    {subMasterLabelLookup(child.id) || child.name}
                                  </option>
                                )
                              )}
                            </select>
                          </div>
                        )
                      : null}
                    {errors.osSubMasterId ? (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.osSubMasterId.message}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
            {mastersError ? (
              <p className="text-xs text-destructive" role="alert">
                {mastersError}
              </p>
            ) : null}
            {subMastersError ? (
              <p className="text-xs text-destructive" role="alert">
                {subMastersError}
              </p>
            ) : null}
          </section>

          <section className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Share the device story, refurbishment process, and warranty coverage."
                className="min-h-[140px]"
                {...register("description")}
              />
              {errors.description ? (
                <p className="text-sm text-destructive" role="alert">
                  {errors.description.message}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Appears near the top of the detail page and in product teasers.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="richDescription">Rich product story</Label>
              <Controller
                control={control}
                name="richDescription"
                render={({ field: { value, onChange } }) => (
                  <RichTextEditor
                    value={value!}
                    onChange={onChange}
                    placeholder="Start writing... add images, videos, and formatted text."
                  />
                )}
              />
              {errors.richDescription ? (
                <p className="text-sm text-destructive" role="alert">
                  {errors.richDescription.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="highlights">Highlights</Label>
              <Textarea
                id="highlights"
                placeholder={`Add up to ${MAX_PRODUCT_HIGHLIGHTS} bullet points. Enter one per line.`}
                className="min-h-[120px]"
                {...register("highlights")}
              />
              <p className="text-xs text-muted-foreground">
                Showcase key selling points, warranty terms, or bundled
                accessories.
              </p>
              {errors.highlights ? (
                <p className="text-sm text-destructive" role="alert">
                  {errors.highlights.message}
                </p>
              ) : null}
            </div>
          </section>
          {serverError ? (
            <div>
              <p className="text-sm text-destructive" role="alert">
                {serverError}
              </p>
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col justify-end gap-3 sm:flex-row">
          {onCancel ? (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          ) : null}
          <Button type="submit" className="sm:ml-auto" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : mode === "create"
              ? "Create product"
              : "Save changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
