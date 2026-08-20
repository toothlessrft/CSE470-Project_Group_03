require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const exhibitionsRoutes = require("./routes/exhibitions");
const authRoutes = require("./routes/auth");
const approvalRoutes = require("./routes/userApproval");
const archaeologistRoutes = require("./routes/archaeologist");
const adminRoutes = require("./routes/admin");
const museumManagerRoutes = require("./routes/museumManager");
const excavationTeamRoutes = require("./routes/excavationTeam"); // Ahad_23201016
const tenderRoutes = require("./routes/tenders"); // Ahad_23201016 - Tender Publication & Bidding
const reportsRoutes = require("./routes/reports");
const artifactLoanRoutes = require("./routes/artifactLoan");
const searchRoutes = require("./routes/search");
const itemsRoutes = require("./routes/items");
const researcherReportRoutes = require("./routes/researcherReport"); //Researcher Report: Ahad
const knowledgeRoutes = require("./routes/knowledge");
const auctionsRoutes = require("./routes/auctions");
const notificationRoutes = require("./routes/notifications"); // Role-Based Notification & Reminder System
const inventoryRoutes = require("./routes/inventory"); // Tool & Field Equipment Requests + Inventory Tracking
const { startReminderScheduler } = require("./services/reminders");

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
app.use("/api/loans", artifactLoanRoutes);
app.use("/api/et", excavationTeamRoutes); // Ahad_23201016
app.use("/api/tenders", tenderRoutes); // Ahad_23201016
app.use("/api/reports", reportsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/items", itemsRoutes);
app.use("/api/researcher-report", researcherReportRoutes);
app.use("/api/knowledge", knowledgeRoutes);
app.use("/api/exhibitions", exhibitionsRoutes);
app.use("/api/auctions", auctionsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/inventory", inventoryRoutes);

// 404 fallback
app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

function startServer(portCandidates) {
  const port = Number(portCandidates[0]);
  const server = app.listen(port, () => {
    console.log(`[server] listening on port ${port}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && portCandidates.length > 1) {
      const nextPort = portCandidates[1];
      console.warn(`[server] Port ${port} is busy; retrying on ${nextPort}`);
      startServer(portCandidates.slice(1));
      return;
    }

    console.error("[server] failed to start", error);
    process.exit(1);
  });
}

const PORT = Number(process.env.PORT || 5555);
const portCandidates = [PORT, 5556, 5557, 5558, 5559];

connectDB().then(() => {
  startServer(portCandidates);
  // Automatic deadline reminders (tenders, reports, auctions, equipment
  // returns, artifact loans, exhibitions).
  startReminderScheduler();
});
