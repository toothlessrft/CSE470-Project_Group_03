import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Unauthorized from "./pages/Unauthorized";
import ReportDiscovery from "./pages/ReportDiscovery";
import MyReports from "./pages/MyReports";
import PublicDashboard from "./pages/public/PublicDashboard";


import ArcDashboard from "./pages/arc/ArcDashboard";
import PendingUsers from "./pages/admin/PendingUsers";
import RequestExcavation from "./pages/arc/RequestExcavation";
import ManageProjects from "./pages/arc/ManageProjects";
import ManageTeam from "./pages/arc/ManageTeam";
import EditSite from "./pages/arc/EditSite";
import AddItem from "./pages/arc/AddItem";
import ToolRequest from "./pages/arc/ToolRequest";
import MyAssignments from "./pages/arc/MyAssignments";

import MManagerDashboard from "./pages/mm/MManagerDashboard";
import RequestItems from "./pages/mm/RequestItems";

import SCaretakerDashboard from "./pages/sc/SCaretakerDashboard";
import RequestMaintenance from "./pages/sc/RequestMaintenance";

import AdminDashboard from "./pages/admin/AdminDashboard";
import ApproveItemRequest from "./pages/admin/ApproveItemRequest";
import ApproveMaintenanceRequest from "./pages/admin/ApproveMaintenanceRequest";
import ApproveToolRequest from "./pages/admin/ApproveToolRequest";
import ViewApprovedRequests from "./pages/admin/ViewApprovedRequests";
import ManageExcavationRequests from "./pages/admin/ManageExcavationRequests";
import ViewExcavationRequest from "./pages/admin/ViewExcavationRequest";
import FieldReports from "./pages/admin/FieldReports";
import AssignInspection from "./pages/admin/AssignInspection";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Artifact Discovery Logging - open to any logged-in user */}
        <Route
          path="/report-discovery"
          element={
            <ProtectedRoute>
              <ReportDiscovery />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-reports"
          element={
            <ProtectedRoute>
              <MyReports />
            </ProtectedRoute>
          }
        />

        {/* Archaeologist */}
        <Route
          path="/arc/dashboard"
          element={
            <ProtectedRoute role="archaeologist">
              <ArcDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/arc/request-excavation"
          element={
            <ProtectedRoute role="archaeologist">
              <RequestExcavation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/arc/projects"
          element={
            <ProtectedRoute role="archaeologist">
              <ManageProjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/arc/projects/:projectId/team"
          element={
            <ProtectedRoute role="archaeologist">
              <ManageTeam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/arc/projects/:projectId/site"
          element={
            <ProtectedRoute role="archaeologist">
              <EditSite />
            </ProtectedRoute>
          }
        />
        <Route
          path="/arc/projects/:projectId/items"
          element={
            <ProtectedRoute role="archaeologist">
              <AddItem />
            </ProtectedRoute>
          }
        />
        <Route
          path="/arc/projects/:projectId/tools"
          element={
            <ProtectedRoute role="archaeologist">
              <ToolRequest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/arc/assignments"
          element={
            <ProtectedRoute role="archaeologist">
              <MyAssignments />
            </ProtectedRoute>
          }
        />

        {/* Museum manager */}
        <Route
          path="/mm/dashboard"
          element={
            <ProtectedRoute role="museum_manager">
              <MManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mm/request-items"
          element={
            <ProtectedRoute role="museum_manager">
              <RequestItems />
            </ProtectedRoute>
          }
        />

        {/* Site caretaker */}
        <Route
          path="/sc/dashboard"
          element={
            <ProtectedRoute role="site_caretaker">
              <SCaretakerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sc/request-maintenance"
          element={
            <ProtectedRoute role="site_caretaker">
              <RequestMaintenance />
            </ProtectedRoute>
          }
        />

        {/* Public */}
        <Route
    path="/public/dashboard"
    element={
        <ProtectedRoute roles={["public"]}>
            <PublicDashboard />
        </ProtectedRoute>
    }
/>

        {/* Admin */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/item-requests"
          element={
            <ProtectedRoute role="admin">
              <ApproveItemRequest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/maintenance-requests"
          element={
            <ProtectedRoute role="admin">
              <ApproveMaintenanceRequest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tool-requests"
          element={
            <ProtectedRoute role="admin">
              <ApproveToolRequest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approved-requests"
          element={
            <ProtectedRoute role="admin">
              <ViewApprovedRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/excavation-requests"
          element={
            <ProtectedRoute role="admin">
              <ManageExcavationRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/excavation-requests/:id"
          element={
            <ProtectedRoute role="admin">
              <ViewExcavationRequest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute role="admin">
              <FieldReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports/:id"
          element={
            <ProtectedRoute role="admin">
              <AssignInspection />
            </ProtectedRoute>
          }
        />
        <Route
    path="/admin/pending-users"
    element={<PendingUsers />}
/>

        <Route path="*" element={<Home />} />
      </Routes>
    </>
  );
}
