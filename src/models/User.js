// src/models/User.js
import { BaseModel } from "./BaseModel.js";

export class User extends BaseModel {
  static entityName = "user";

  constructor(data) {
    super(data);
    this.name = data.name || "";
    this.profileId = data.profileId || null; // Foreign key to Profile
  }
}