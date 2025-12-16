import mongoose, { Schema, type InferSchemaType } from "mongoose";

import { masterTypes } from "@/lib/master-constants";

const SubMasterOptionSchema = new Schema(
  {
    masterId: {
      type: Schema.Types.ObjectId,
      ref: "MasterOption",
      required: true,
      index: true,
    },
    masterType: {
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
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "SubMasterOption",
      default: null,
      index: true,
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

SubMasterOptionSchema.index({ masterId: 1, parentId: 1, name: 1 }, { unique: true });

export type SubMasterOptionDocument = InferSchemaType<typeof SubMasterOptionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SubMasterOptionModel =
  mongoose.models.SubMasterOption ||
  mongoose.model<SubMasterOptionDocument>("SubMasterOption", SubMasterOptionSchema);
