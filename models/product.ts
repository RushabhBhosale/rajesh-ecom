import mongoose, { Schema, type InferSchemaType } from "mongoose";

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
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "MasterOption",
      default: null,
      index: true,
    },
    companySubmasterId: {
      type: Schema.Types.ObjectId,
      ref: "SubMasterOption",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export type ProductDocument = InferSchemaType<typeof ProductSchema> & {
  _id: mongoose.Types.ObjectId;
};

if (mongoose.models.Product) {
  delete mongoose.models.Product;
}

export const ProductModel = mongoose.model<ProductDocument>("Product", ProductSchema);
