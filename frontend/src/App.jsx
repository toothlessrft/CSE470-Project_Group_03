import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import ArtifactIdentifier from "./components/ArtifactIdentifier"; // AI Artifact Identification

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
import ExhibitionManagement from "./pages/mm/ExhibitionManagement";
import Exhibitions from "./pages/public/Exhibitions";
import MuseumProfile from "./pages/mm/MuseumProfile";
import MuseumDirectory from "./pages/public/MuseumDirectory";
import MuseumDetail from "./pages/public/MuseumDetail";
import NearMe from "./pages/public/NearMe";

// Ahad_23201016 - Excavation Team (replaces Site Caretaker)
import ETeamDashboard from "./pages/et/ETeamDashboard";
import BrowseTenders from "./pages/et/BrowseTenders";
import MyBids from "./pages/et/MyBids";
import ETeamProjects from "./pages/et/ETeamProjects";
import ProjectDetail from "./pages/project/ProjectDetail";

import AdminDashboard from "./pages/admin/AdminDashboard";
import ApproveItemRequest from "./pages/admin/ApproveItemRequest";
import ApproveToolRequest from "./pages/admin/ApproveToolRequest";
import ViewApprovedRequests from "./pages/admin/ViewApprovedRequests";
import ManageExcavationRequests from "./pages/admin/ManageExcavationRequests";
import ViewExcavationRequest from "./pages/admin/ViewExcavationRequest";
import FieldReports from "./pages/admin/FieldReports";
import AssignInspection from "./pages/admin/AssignInspection";
import RequestLoan from "./pages/mm/RequestLoan";
import MyLoanRequests from "./pages/mm/MyLoanRequests";
import IncomingLoanRequests from "./pages/mm/IncomingLoanRequests";
import MyMuseumArtifacts from "./pages/mm/MyMuseumArtifacts";
import ArtifactSearch from "./pages/public/ArtifactSearch";
import KnowledgeHub from "./pages/KnowledgeHub";
import Auctions from "./pages/public/Auctions";
import AuctionDetail from "./pages/public/AuctionDetail";
import ManageAuctions from "./pages/admin/ManageAuctions";
import CreateAuction from "./pages/admin/CreateAuction";
// Ahad_23201016 - Tender Publication & Management
import ManageTenders from "./pages/admin/ManageTenders";
import CreateTender from "./pages/admin/CreateTender";
import TenderDetail from "./pages/admin/TenderDetail";
import ExcavationProjects from "./pages/admin/ExcavationProjects";
// Tool & Field Equipment Requests + Inventory Tracking
import RequestEquipment from "./pages/tools/RequestEquipment";
import ToolInventory from "./pages/admin/ToolInventory";
// Cross Feedback & Performance Review System
import SubmitReview from "./pages/SubmitReview";
import ReviewHistory from "./pages/ReviewHistory";
// Project Team Group Chat
import TeamChatPage from "./pages/chat/TeamChatPage";
// Public Archaeology Q&A
import QnAList from "./pages/qna/QnAList";
import QuestionDetail from "./pages/qna/QuestionDetail";
import AskQuestion from "./pages/qna/AskQuestion";
import MyQuestions from "./pages/qna/MyQuestions";
import MyAnswers from "./pages/qna/MyAnswers";


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

        {/* Cross Feedback & Performance Review System - open to any logged-in user */}
        <Route
          path="/reviews/history/:userId"
          element={
            <ProtectedRoute>
              <ReviewHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reviews/history"
          element={
            <ProtectedRoute>
              <ReviewHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reviews/:projectId"
          element={
            <ProtectedRoute>
              <SubmitReview />
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
        {/* Ahad_23201016 - detailed project view */}
        <Route
          path="/arc/projects/:projectId"
          element={
            <ProtectedRoute role="archaeologist">
              <ProjectDetail />
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

        {/* Tools & Field Equipment - archaeologists and excavation teams.
            The API rejects anyone who isn't leading or assigned to an active
            project, so a single shared route is enough here. */}
        <Route
          path="/equipment"
          element={
            <ProtectedRoute>
              <RequestEquipment />
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
        <Route 
          path="/mm/request-loan" 
          element={
            <ProtectedRoute role="museum_manager">
              <RequestLoan />
            </ProtectedRoute>
            }
        />
        <Route 
          path="/mm/my-loans" 
          element={
            <ProtectedRoute role="museum_manager">
                <MyLoanRequests />
            </ProtectedRoute>
            } 
        />
        <Route 
          path="/mm/incoming-loans" 
          element={
            <ProtectedRoute role="museum_manager">
              <IncomingLoanRequests />
            </ProtectedRoute>
            }
        />
        <Route
          path="/mm/my-museum-items"
          element={
            <ProtectedRoute role="museum_manager">
              <MyMuseumArtifacts />
            </ProtectedRoute>
          }
        />
        <Route
  path="/mm/exhibitions"
  element={
    <ProtectedRoute role="museum_manager">
      <ExhibitionManagement />
    </ProtectedRoute>
  }
/>
        <Route
          path="/mm/museum-profile"
          element={
            <ProtectedRoute role="museum_manager">
              <MuseumProfile />
            </ProtectedRoute>
          }
        />
        {/* Ahad_23201016 - Excavation Team */}
        <Route
          path="/et/dashboard"
          element={
            <ProtectedRoute role="excavation_team">
              <ETeamDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/et/tenders"
          element={
            <ProtectedRoute role="excavation_team">
              <BrowseTenders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/et/bids"
          element={
            <ProtectedRoute role="excavation_team">
              <MyBids />
            </ProtectedRoute>
          }
        />
        <Route
          path="/et/projects"
          element={
            <ProtectedRoute role="excavation_team">
              <ETeamProjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/et/projects/:projectId"
          element={
            <ProtectedRoute role="excavation_team">
              <ProjectDetail />
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
        <Route 
          path="/search" 
          element={<ArtifactSearch />} 
        />
        <Route 
          path="/knowledge" 
          element={<KnowledgeHub />} 
        />
        <Route path="/exhibitions" element={<Exhibitions />} />
        <Route path="/museums" element={<MuseumDirectory />} />
        <Route path="/museums/:museumName" element={<MuseumDetail />} />
        <Route path="/near-me" element={<NearMe />} />

        {/* Auctions - browsing is open to everyone, bidding/wishlist require login (enforced in the page/API) */}
        <Route path="/auctions" element={<Auctions />} />
        <Route path="/auctions/:id" element={<AuctionDetail />} />

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
          path="/admin/tool-requests"
          element={
            <ProtectedRoute role="admin">
              <ApproveToolRequest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tool-inventory"
          element={
            <ProtectedRoute role="admin">
              <ToolInventory />
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
        {/* Ahad_23201016 - Tender Publication & Management (Government) */}
        <Route
          path="/admin/tenders"
          element={
            <ProtectedRoute role="admin">
              <ManageTenders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tenders/new"
          element={
            <ProtectedRoute role="admin">
              <CreateTender />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tenders/:id"
          element={
            <ProtectedRoute role="admin">
              <TenderDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/excavation-projects"
          element={
            <ProtectedRoute role="admin">
              <ExcavationProjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/excavation-projects/:projectId"
          element={
            <ProtectedRoute role="admin">
              <ProjectDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/auctions"
          element={
            <ProtectedRoute role="admin">
              <ManageAuctions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/auctions/new"
          element={
            <ProtectedRoute role="admin">
              <CreateAuction />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/auctions/:id/edit"
          element={
            <ProtectedRoute role="admin">
              <CreateAuction />
            </ProtectedRoute>
          }
        />

        {/* Project Team Group Chat - open to any assigned/authorized member */}
        <Route
          path="/chats/:projectId"
          element={
            <ProtectedRoute>
              <TeamChatPage />
            </ProtectedRoute>
          }
        />

        {/* Public Archaeology Q&A - browsing is open to everyone, guests included */}
        <Route path="/qna" element={<QnAList />} />
        <Route path="/qna/:id" element={<QuestionDetail />} />
        <Route
          path="/qna/ask"
          element={
            <ProtectedRoute role="public">
              <AskQuestion />
            </ProtectedRoute>
          }
        />
        <Route
          path="/qna/my-questions"
          element={
            <ProtectedRoute role="public">
              <MyQuestions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/qna/my-answers"
          element={
            <ProtectedRoute role="archaeologist">
              <MyAnswers />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Home />} />
      </Routes>

      {/* AI Artifact Identification - floating launcher, every page */}
      <ArtifactIdentifier />
    </>
  );
}