import { storage } from "../server/storage";

async function makeAdmin() {
  try {
    const user = await storage.getUserByUsername("admin");
    if (!user) {
      console.error("User 'admin' not found");
      process.exit(1);
    }

    const updatedUser = await storage.updateUser(user.id, { isAdmin: true });
    console.log(`Successfully made user '${updatedUser.username}' an admin`);
    process.exit(0);
  } catch (error) {
    console.error("Error making user admin:", error);
    process.exit(1);
  }
}

makeAdmin();
