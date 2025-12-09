import mongoose, { Schema, type InferSchemaType } from "mongoose";

import { masterTypes } from "@/lib/master-constants";

const MasterOptionSchema = new Schema(
  {
    type: {
      type: String,
      enum: masterTypes,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

MasterOptionSchema.index({ type: 1, name: 1 }, { unique: true });

export type MasterOptionDocument = InferSchemaType<typeof MasterOptionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const MasterOptionModel =
  mongoose.models.MasterOption || mongoose.model<MasterOptionDocument>("MasterOption", MasterOptionSchema);
