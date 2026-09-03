import { useNavigate, useParams } from "react-router-dom";
import ReviewModal from "../components/ReviewModal";
import { useAuth, ROLE_HOME } from "../context/AuthContext";

/*
  Full-page host for the "Rate your partner" popup - this is where a
  "Project finished - rate your partner" notification's "Go to page" button
  lands (see the "review" category in components/NotificationBell.jsx).
*/
export default function SubmitReview() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Opened from a notification there is history to go back to. Opened from a
  // pasted or bookmarked link there is not, and navigate(-1) would walk the
  // user out of the app entirely - so fall back to their own dashboard.
  function close() {
    if (window.history.length > 1) navigate(-1);
    else navigate(ROLE_HOME[user?.role] || "/");
  }

  return <ReviewModal projectId={projectId} onClose={close} onSubmitted={() => {}} />;
}
