// Group chat between the archaeologist and the excavation team. Called from
// the award and completion flows in routes/tenders.js, so the chat's lifecycle
// follows the project's.
const TeamChat = require("../models/TeamChat");
const ChatMessage = require("../models/ChatMessage");
const { notify } = require("./notify");

// Create the chat once a project has both parties. No-ops if one exists.
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

// Archive on completion - read-only, but stays in chat history.
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
