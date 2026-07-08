require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const approvalRoutes = require("./routes/userApproval");
const archaeologistRoutes = require("./routes/archaeologist");
const adminRoutes = require("./routes/admin");
const museumManagerRoutes = require("./routes/museumManager");
const siteCaretakerRoutes = require("./routes/siteCaretaker");
const reportsRoutes = require("./routes/reports");

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/admin", approvalRoutes);
app.use("/api/arc", archaeologistRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/mm", museumManagerRoutes);
app.use("/api/sc", siteCaretakerRoutes);
app.use("/api/reports", reportsRoutes);

// 404 fallback
app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

const PORT = process.env.PORT || 5555;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`[server] listening on port ${PORT}`));
});
