import { connectDB } from "@/lib/db";
import { addressSchema, type AddressInput } from "@/lib/address-validation";
import { AddressModel, type AddressDocument } from "@/models/address";

export interface SavedAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

function mapAddress(doc: AddressDocument): SavedAddress {
  return {
    id: doc._id.toString(),
    label: doc.label ?? "",
    recipientName: doc.recipientName,
    phone: doc.phone,
    line1: doc.line1,
    line2: doc.line2 ?? "",
    city: doc.city,
    state: doc.state,
    postalCode: doc.postalCode,
    country: doc.country ?? "India",
    isDefault: Boolean(doc.isDefault),
  };
}

export async function listAddresses(userId: string): Promise<SavedAddress[]> {
  await connectDB();
  const addresses = await AddressModel.find({ userId }).sort({ isDefault: -1, createdAt: -1 }).lean<AddressDocument[]>();
  return addresses.map((addr) => mapAddress(addr as AddressDocument));
}

export async function createAddress(userId: string, input: AddressInput): Promise<SavedAddress> {
  await connectDB();
  const payload = addressSchema.parse(input);

  if (payload.isDefault) {
    await AddressModel.updateMany({ userId }, { $set: { isDefault: false } });
  }

  const created = await AddressModel.create({ ...payload, userId });
  return mapAddress(created as AddressDocument);
}

export async function updateAddress(userId: string, addressId: string, input: AddressInput): Promise<SavedAddress | null> {
  await connectDB();
  const payload = addressSchema.parse(input);

  const existing = await AddressModel.findOne({ _id: addressId, userId });
  if (!existing) {
    return null;
  }

  if (payload.isDefault) {
    await AddressModel.updateMany({ userId, _id: { $ne: addressId } }, { $set: { isDefault: false } });
  }

  existing.set(payload);
  await existing.save();
  return mapAddress(existing as AddressDocument);
}

export async function deleteAddress(userId: string, addressId: string): Promise<boolean> {
  await connectDB();
  const deleted = await AddressModel.findOneAndDelete({ _id: addressId, userId });
  return Boolean(deleted);
}
