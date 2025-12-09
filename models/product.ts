import mongoose, { Schema, type InferSchemaType } from "mongoose";

import { productConditions } from "@/lib/product-constants";

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    condition: {
      type: String,
      enum: productConditions,
      default: "refurbished",
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "MasterOption",
      default: null,
      index: true,
    },
    companyName: {
      type: String,
      trim: true,
      default: "",
    },
    processorId: {
      type: Schema.Types.ObjectId,
      ref: "MasterOption",
      default: null,
      index: true,
    },
    processorName: {
      type: String,
      trim: true,
      default: "",
    },
    ramId: {
      type: Schema.Types.ObjectId,
      ref: "MasterOption",
      default: null,
      index: true,
    },
    ramName: {
      type: String,
      trim: true,
      default: "",
    },
    storageId: {
      type: Schema.Types.ObjectId,
      ref: "MasterOption",
      default: null,
      index: true,
    },
    storageName: {
      type: String,
      trim: true,
      default: "",
    },
    graphicsId: {
      type: Schema.Types.ObjectId,
      ref: "MasterOption",
      default: null,
      index: true,
    },
    graphicsName: {
      type: String,
      trim: true,
      default: "",
    },
    osId: {
      type: Schema.Types.ObjectId,
      ref: "MasterOption",
      default: null,
      index: true,
    },
    osName: {
      type: String,
      trim: true,
      default: "",
    },
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
    galleryImages: {
      type: [String],
      default: [],
    },
    richDescription: {
      type: String,
      default: "",
      trim: true,
    },
    highlights: {
      type: [String],
      default: [],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    variants: {
      type: [
        {
          label: { type: String, required: true, trim: true },
          price: { type: Number, required: true, min: 0 },
        },
      ],
      default: [],
    },
    colors: {
      type: [String],
      default: [],
    },
    inStock: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export type ProductDocument = InferSchemaType<typeof ProductSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ProductModel =
  mongoose.models.Product || mongoose.model<ProductDocument>("Product", ProductSchema);
