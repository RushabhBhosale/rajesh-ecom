import mongoose, { Schema, type InferSchemaType } from "mongoose";

const StoreSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    gstEnabled: { type: Boolean, default: true },
    gstRate: { type: Number, default: 18 },
    shippingEnabled: { type: Boolean, default: false },
    shippingAmount: { type: Number, default: 0 },
    topBarEnabled: { type: Boolean, default: true },
    topBarMessage: {
      type: String,
      default: "Free 2-day shipping on business orders over $499",
      trim: true,
    },
    topBarCtaText: { type: String, default: "Browse featured inventory", trim: true },
    topBarCtaHref: { type: String, default: "/products", trim: true },
  },
  { timestamps: true }
);

export type StoreSettingDocument = InferSchemaType<typeof StoreSettingSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const StoreSettingModel =
  mongoose.models.StoreSetting || mongoose.model<StoreSettingDocument>("StoreSetting", StoreSettingSchema);
