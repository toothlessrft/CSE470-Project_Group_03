import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function Unauthorized() {
  return (
    <div className="page narrow">
      <div className="empty-state">
        <ShieldAlert size={26} aria-hidden="true" />
        <h3>Access not permitted</h3>
        <p>
          Your account role does not have permission to view this page. If you believe this is an
          error, contact the heritage authority that approved your registration.
        </p>
        <Link className="btn btn-secondary" to="/">
          Return to the register
        </Link>
      </div>
    </div>
  );
}