// src/models/Profile.js
import { BaseModel } from "./BaseModel.js";
import { User } from "./User.js";

export class Profile extends BaseModel {
  static entityName = "profile";

  constructor(data) {
    super(data);
    this.userId = data.userId || null; // Foreign key to User
    this.bio = data.bio || "";
  }

  async getUser(){
    return this.hasMany(User,'userId')
  }
}