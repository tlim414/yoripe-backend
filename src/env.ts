import dotenv from "dotenv";
import path from "path";

dotenv.config(); // base .env

dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
  override: true,
});