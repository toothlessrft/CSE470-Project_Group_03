import { HandCoins, FileClock, Inbox } from "lucide-react";
import ActionGrid from "../../components/ActionGrid";

const actions = [
  { to: "/mm/request-loan", icon: HandCoins, title: "Request a loan", description: "Ask another museum to lend an artifact from its collection" },
  { to: "/mm/my-loans", icon: FileClock, title: "Outgoing loan requests", description: "Track the loans you have applied for and their outcomes" },
  { to: "/mm/incoming-loans", icon: Inbox, title: "Incoming loan requests", description: "Decide on requests from other museums to borrow your holdings" },
];

export default function LoansHub() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Inter-museum loans</span>
          <h1>Loans</h1>
          <p className="page-subtitle">
            Request artifacts from other museums, and manage loans in both directions.
          </p>
        </div>
      </div>
      <ActionGrid items={actions} />
    </div>
  );
}