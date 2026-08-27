// Project Team Group Chat (Archaeologist & Excavation Team) - write-side
// helpers, called from the tender award / project completion flows in
// routes/tenders.js so the chat's lifecycle always tracks the project's.
const TeamChat = require("../models/TeamChat");
const ChatMessage = require("../models/ChatMessage");
const { notify } = require("./notify");

/**
 * Auto-create the group chat the moment a project has both a lead
 * archaeologist and an assigned excavation team. Safe to call more than
 * once for the same project - it no-ops if a chat already exists.
 */
async function ensureChatForProject(project) {
  if (!project?.lead_archaeologist || !project?.excavation_team) return null;

  const existing = await TeamChat.findOne({ project: project._id });
  if (existing) return existing;

  const chat = await TeamChat.create({
    project: project._id,
    participants: [
      { user: project.lead_archaeologist, role: "archaeologist" },
      { user: project.excavation_team, role: "excavation_team" },
    ],
  });

  await ChatMessage.create({
    chat: chat._id,
    sender: project.lead_archaeologist,
    system: true,
    text: `Group chat created for "${project.p_name}". Assigned members can now message and share updates here.`,
  });

  await notify({
    user: project.excavation_team,
    category: "assignment",
    type: "chat.created",
    title: "Project group chat is ready",
    message: `A group chat for "${project.p_name}" has been created. Coordinate with the lead archaeologist there.`,
    link: `/chats/${project._id}`,
  });

  return chat;
}

/** Archive the project's chat on completion. It stays readable in history. */
async function archiveChatForProject(projectId) {
  const chat = await TeamChat.findOneAndUpdate(
    { project: projectId, archived: false },
    { archived: true, archived_at: new Date() },
    { new: true }
  );
  if (!chat) return null;

  await ChatMessage.create({
    chat: chat._id,
    sender: chat.participants[0]?.user,
    system: true,
    text: "This excavation project has been completed. The chat is now archived and read-only, but stays in your chat history.",
  });

  return chat;
}

module.exports = { ensureChatForProject, archiveChatForProject };
