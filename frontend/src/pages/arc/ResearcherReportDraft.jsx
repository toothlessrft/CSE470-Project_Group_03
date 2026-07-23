//Researcher Report: Ahad
import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { api } from "../../api";

const ARTIFACT_TYPES = ["Pottery", "Metal_Object", "Paintings", "Human_Remains", "Rock", "Jewelry", "Bone/Ivory", "other"];

const EMPTY_ARTIFACT = {
    name: "", description: "", Type: "other",
    civilization: "", era: "", region: "", material: "", usage: "", picture: "",
};

export default function ResearcherReportDraft({ discoveryId, onSubmitted }) {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState({
        possibleArtifact: false,
        notes: "",
        budgetRequested: "",
        requestExcavationTeam: false,
    });

    // Report Approval & Artifact Allocation: artifacts found on site, added
    // the same way as the "Add Artifact" flow on Smart Artifact Search.
    const [artifacts, setArtifacts] = useState([]);
    const [showArtifactModal, setShowArtifactModal] = useState(false);
    const [editingArtifactIndex, setEditingArtifactIndex] = useState(null);
    const [artifactForm, setArtifactForm] = useState(EMPTY_ARTIFACT);

    const [busy, setBusy] = useState(false);

    useEffect(() => {
        loadReport();
    }, [discoveryId]);

    function loadReport() {
        setLoading(true);
        api
            .get(`/researcher-report/${discoveryId}`)
            .then((data) => {
                setReport(data.report);
                setForm({
                    possibleArtifact: data.report.possibleArtifact || false,
                    notes: data.report.notes || "",
                    budgetRequested: data.report.budgetRequested || "",
                    requestExcavationTeam: data.report.requestExcavationTeam || false,
                });
                setArtifacts(data.report.artifacts || []);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }

    async function handleSaveDraft(e) {
        e.preventDefault();
        setError("");
        setSuccess("");
        setBusy(true);
        try {
            const data = await api.post(`/researcher-report/${discoveryId}/save`, { ...form, artifacts });
            setSuccess("Draft saved successfully.");
            setReport(data.report);
            setArtifacts(data.report.artifacts || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    async function handleSubmitFinal() {
        if (!window.confirm("Are you sure you want to submit the final report? No more edits can be made, and it will be sent to the admin for approval.")) return;
        setError("");
        setSuccess("");
        setBusy(true);
        try {
            const data = await api.post(`/researcher-report/${discoveryId}/submit`);
            setSuccess("Final report submitted successfully.");
            setReport(data.report);
            // Notify parent to reload list so the card moves to Previous Projects once approved
            if (onSubmitted) onSubmitted();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    // ---- Artifacts found on site (local list, persisted with Save Draft) ----
    function openAddArtifact() {
        setEditingArtifactIndex(null);
        setArtifactForm(EMPTY_ARTIFACT);
        setShowArtifactModal(true);
    }

    function openEditArtifact(index) {
        setEditingArtifactIndex(index);
        setArtifactForm({ ...EMPTY_ARTIFACT, ...artifacts[index] });
        setShowArtifactModal(true);
    }

    function handleRemoveArtifact(index) {
        if (!window.confirm("Remove this artifact from the report?")) return;
        setArtifacts((prev) => prev.filter((_, i) => i !== index));
    }

    function handleArtifactFormSubmit(e) {
        e.preventDefault();
        if (!artifactForm.name.trim()) return;
        setArtifacts((prev) => {
            if (editingArtifactIndex === null) return [...prev, artifactForm];
            const next = [...prev];
            next[editingArtifactIndex] = artifactForm;
            return next;
        });
        setShowArtifactModal(false);
    }

    if (loading) return <p className="hint">Loading researcher report...</p>;
    if (!report) return <div className="alert alert-danger">{error || "Failed to load report"}</div>;

    const isDraft = report.status === "Draft";
    const isPending = report.status === "Pending";
    const isApproved = report.status === "Approved";
    const isLocked = !isDraft; // Pending or Approved - no more edits allowed

    return (
        <div className="card" style={{ marginTop: "1rem", border: "2px dashed #c98a4b", backgroundColor: "#fdf8f2" }}>
            <h3 style={{ color: "#7c4a2d", marginTop: 0 }}>Researcher Report</h3>
            <p className="hint">
                {isApproved
                    ? "This report has been approved by the admin. Its artifacts are now in the catalogue."
                    : isPending
                        ? "Final report submitted. Waiting for admin approval before this moves to Previous Assignments."
                        : "Work on your findings below piece by piece. Save as draft until you are completely finished."
                }
            </p>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="form">
                <label style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.5rem", cursor: isLocked ? "not-allowed" : "pointer" }}>
                    <input
                        type="checkbox"
                        checked={form.possibleArtifact}
                        onChange={(e) => setForm({ ...form, possibleArtifact: e.target.checked })}
                        disabled={isLocked || busy}
                        style={{ width: "20px", height: "20px" }}
                    />
                    <span style={{ fontWeight: 600 }}>Is there a possible artifact here? (Notify Admin)</span>
                </label>

                <label style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.5rem", cursor: isLocked ? "not-allowed" : "pointer" }}>
                    <input
                        type="checkbox"
                        checked={form.requestExcavationTeam}
                        onChange={(e) => setForm({ ...form, requestExcavationTeam: e.target.checked })}
                        disabled={isLocked || busy}
                        style={{ width: "20px", height: "20px" }}
                    />
                    <span style={{ fontWeight: 600 }}>Request Excavation Team (Engineers)</span>
                </label>

                <label>
                    Requested Budget (৳) - optional
                    <input
                        type="number"
                        min="0"
                        step="1000"
                        value={form.budgetRequested}
                        onChange={(e) => setForm({ ...form, budgetRequested: e.target.value })}
                        disabled={isLocked || busy}
                        placeholder="e.g. 50000"
                    />
                </label>

                <label>
                    Detailed Notes &amp; Draft Information
                    <textarea
                        rows={5}
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        disabled={isLocked || busy}
                        placeholder="Gradually update your information about the site here..."
                    />
                </label>

                {/* Report Approval & Artifact Allocation: artifacts found on site */}
                <div style={{ marginTop: "0.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <strong>Artifacts Found</strong>
                        {isDraft && (
                            <button type="button" className="btn-small" onClick={openAddArtifact}>
                                <Plus size={14} /> Add Artifact
                            </button>
                        )}
                    </div>

                    {artifacts.length === 0 ? (
                        <p className="hint" style={{ margin: 0 }}>No artifacts added yet.</p>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
                            {artifacts.map((a, i) => (
                                <div key={i} className="card" style={{ margin: 0, padding: "0.85rem 1rem" }}>
                                    <strong>{a.name}</strong>
                                    <p className="hint" style={{ margin: "0.2rem 0" }}>{a.Type}</p>
                                    {a.description && <p style={{ fontSize: "0.85rem", margin: "0 0 0.4rem" }}>{a.description}</p>}
                                    <p style={{ fontSize: "0.8rem", color: "#777", margin: 0 }}>
                                        {a.civilization && <>Civilization: {a.civilization}<br /></>}
                                        {a.era && <>Era: {a.era}<br /></>}
                                        {a.region && <>Region: {a.region}<br /></>}
                                        {a.material && <>Material: {a.material}<br /></>}
                                        {a.usage && <>Usage: {a.usage}</>}
                                    </p>
                                    {isDraft && (
                                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                                            <button type="button" className="btn-small btn-outline" style={{ color: "var(--primary)", borderColor: "var(--primary)" }} onClick={() => openEditArtifact(i)}>
                                                <Edit size={14} /> Edit
                                            </button>
                                            <button type="button" className="btn-small" style={{ color: "#fff", background: "var(--danger, #c0392b)", border: "none" }} onClick={() => handleRemoveArtifact(i)}>
                                                <Trash2 size={14} /> Remove
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {isDraft && (
                    <div className="actions">
                        <button className="btn" onClick={handleSaveDraft} disabled={busy}>Save Draft</button>
                        <button className="btn btn-approve" onClick={handleSubmitFinal} disabled={busy}>Submit Final Report</button>
                    </div>
                )}
            </div>

            {showArtifactModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
                    <div className="card" style={{ width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", margin: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h2>{editingArtifactIndex === null ? "Add Artifact" : "Edit Artifact"}</h2>
                            <button type="button" className="btn-link" onClick={() => setShowArtifactModal(false)}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleArtifactFormSubmit} className="form">
                            <label>Artifact Name required <input value={artifactForm.name} onChange={e => setArtifactForm(f => ({ ...f, name: e.target.value }))} required /></label>
                            <label>Description <textarea rows={3} value={artifactForm.description} onChange={e => setArtifactForm(f => ({ ...f, description: e.target.value }))} /></label>

                            <label>Type
                                <select value={artifactForm.Type} onChange={e => setArtifactForm(f => ({ ...f, Type: e.target.value }))}>
                                    {ARTIFACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </label>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <label>Civilization <input value={artifactForm.civilization} onChange={e => setArtifactForm(f => ({ ...f, civilization: e.target.value }))} /></label>
                                <label>Era <input value={artifactForm.era} onChange={e => setArtifactForm(f => ({ ...f, era: e.target.value }))} /></label>
                                <label>Region <input value={artifactForm.region} onChange={e => setArtifactForm(f => ({ ...f, region: e.target.value }))} /></label>
                                <label>Material <input value={artifactForm.material} onChange={e => setArtifactForm(f => ({ ...f, material: e.target.value }))} /></label>
                                <label>Usage <input value={artifactForm.usage} onChange={e => setArtifactForm(f => ({ ...f, usage: e.target.value }))} /></label>
                            </div>

                            <button type="submit" className="btn">
                                {editingArtifactIndex === null ? "Add to Report" : "Save Changes"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
