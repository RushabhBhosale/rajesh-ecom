import mongoose, { Schema, type InferSchemaType } from "mongoose";

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
    color: {
      type: String,
      trim: true,
      default: "",
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

export const VariantModel =
  mongoose.models.Variant || mongoose.model<VariantDocument>("Variant", VariantSchema);
