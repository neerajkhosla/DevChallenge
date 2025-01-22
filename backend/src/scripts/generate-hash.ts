import bcrypt from "bcrypt";

async function generateHash() {
  const password = "Test@123";
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log("Password:", password);
  console.log("Hashed Password:", hashedPassword);
}

generateHash();
