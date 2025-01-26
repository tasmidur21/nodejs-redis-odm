import { Profile } from "./models/Profile.js";
import { User } from "./models/User.js";
import { redisClient } from "./utils/redisClient.js";

async function main() {
  // Connect to Redis
  await redisClient.connect();

  // Create sample users and profiles
  const user1 = await User.create({ name: "Alice", profileId: "1" });
  const user2 = await User.create({ name: "Bob", profileId: "2" });
  const profile1 = await Profile.create({
    userId: user1.id,
    bio: "Hello, I am Alice!",
  });
  const profile2 = await Profile.create({
    userId: user2.id,
    bio: "Hi, I am Bob!",
  });
  //https://www.blackbox.ai/chat/pd26jgI

  //   // Retrieve all users
  //   const allUsers = await User.all();
  //   console.log('All Users:', allUsers);

  //   // Retrieve all profiles
  const allProfiles = await Profile.getUser();
  console.log("All Profiles:", allProfiles);
  return;

  // Inner Join
  const usersWithProfiles = await User.join(Profile, "profileId");
  console.log("Users with Profiles (Inner Join):", usersWithProfiles);

  //   // Left Join
  const usersWithOptionalProfiles = await User.leftJoin(Profile, "profileId");
  console.log(
    "Users with Optional Profiles (Left Join):",
    usersWithOptionalProfiles
  );

  //   // Right Join
  //   const profilesWithUsers = await Profile.rightJoin(User, 'userId');
  //   console.log('Profiles with Users (Right Join):', profilesWithUsers);

  //   // Clean up: Delete created records
  //   await redisClient.del(User.getKey(user1.id));
  //   await redisClient.del(User.getKey(user2.id));
  //   await redisClient.del(Profile.getKey(profile1.id));
  //   await redisClient.del(Profile.getKey(profile2.id));

  // Disconnect from Redis
  await redisClient.quit();
}

main().catch(console.error);
