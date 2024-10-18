import path from "node:path";
import express from "express";
const app = express();

app.use(express.static("dist"));

app.listen(8000, () => console.info("started server on port 8000"));