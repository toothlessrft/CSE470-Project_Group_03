import { useNavigate, useParams } from "react-router-dom";
import ReviewModal from "../components/ReviewModal";

export default function SubmitReview() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  return <ReviewModal projectId={projectId} onClose={() => navigate(-1)} onSubmitted={() => {}} />;
}
