import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma.js";

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", async (req, res) => {

  res.json({

    message: "Yoripe API running",
  });

});

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {

  console.log(`Server running on port ${PORT}`);

});