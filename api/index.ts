import express from "express";
import path from "path";
import expressLayouts from "express-ejs-layouts";
import { Request, Response } from "express";

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));
app.use(expressLayouts);
app.set("layout", "layouts/main");

// Routes
app.get("/", (req: Request, res: Response) => {
  res.render("index");
});

// Obligatoire : exporter Express pour Vercel
module.exports = app;
