import mongoose, { Schema, type InferSchemaType } from "mongoose";

const AddressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    label: { type: String, default: "", trim: true },
    recipientName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, default: "", trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, default: "India", trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type AddressDocument = InferSchemaType<typeof AddressSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AddressModel =
  mongoose.models.Address || mongoose.model<AddressDocument>("Address", AddressSchema);
