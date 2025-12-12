import mongoose, { Schema, type InferSchemaType } from "mongoose";

import { productConditions } from "@/lib/product-constants";

const VariantSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    sku: {
      type: String,
      trim: true,
      default: "",
    },
    stock: {
      type: Number,
      default: 1,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    condition: {
      type: String,
      enum: productConditions,
      default: "refurbished",
    },
    processorId: {
      type: Schema.Types.ObjectId,
      ref: "MasterOption",
      default: null,
      index: true,
    },
    processorSubmasterId: {
      type: Schema.Types.ObjectId,
      ref: "SubMasterOption",
      default: null,
      index: true,
    },
    ramId: {
      type: Schema.Types.ObjectId,
      ref: "MasterOption",
      default: null,
      index: true,
    },
    ramSubmasterId: {
      type: Schema.Types.ObjectId,
      ref: "SubMasterOption",
      default: null,
      index: true,
    },
    storageId: {
      type: Schema.Types.ObjectId,
      ref: "MasterOption",
      default: null,
      index: true,
    },
    storageSubmasterId: {
      type: Schema.Types.ObjectId,
      ref: "SubMasterOption",
      default: null,
      index: true,
    },
    graphicsId: {
      type: Schema.Types.ObjectId,
      ref: "MasterOption",
      default: null,
      index: true,
    },
    graphicsSubmasterId: {
      type: Schema.Types.ObjectId,
      ref: "SubMasterOption",
      default: null,
      index: true,
    },
    osId: {
      type: Schema.Types.ObjectId,
      ref: "MasterOption",
      default: null,
      index: true,
    },
    osSubmasterId: {
      type: Schema.Types.ObjectId,
      ref: "SubMasterOption",
      default: null,
      index: true,
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
    colors: {
      type: [String],
      default: [],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      trim: true,
      default: "",
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

VariantSchema.index({ productId: 1, label: 1 }, { unique: true });

export type VariantDocument = InferSchemaType<typeof VariantSchema> & {
  _id: mongoose.Types.ObjectId;
};

if (mongoose.models.Variant) {
  delete mongoose.models.Variant;
}

export const VariantModel = mongoose.model<VariantDocument>("Variant", VariantSchema);
