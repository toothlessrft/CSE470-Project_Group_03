// Project Team Group Chat (Archaeologist & Excavation Team)
//
// One chat per excavation project, auto-created when the project gets both a
// lead archaeologist and an assigned excavation team (see services/teamChat.js,
// hooked into the tender award / project completion flow in routes/tenders.js).
const express = require("express");
const TeamChat = require("../models/TeamChat");
const ChatMessage = require("../models/ChatMessage");
const ExcavationProject = require("../models/ExcavationProject");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { ensureChatForProject } = require("../services/teamChat");

const router = express.Router();
router.use(requireAuth);

const PARTICIPANT_FIELDS = "name nid role roleProfile.company_name roleProfile.affiliation profile_pic";

function isParticipant(chat, userId) {
  return chat.participants.some((p) => String(p.user?._id || p.user) === String(userId));
}

async function loadChat(req, res) {
  const project = await ExcavationProject.findById(req.params.projectId).select(
    "p_name lead_archaeologist excavation_team end_date"
  );
  if (!project) {
    res.status(404).json({ error: "Project not found." });
    return null;
  }

  let chat = await TeamChat.findOne({ project: project._id }).populate("participants.user", PARTICIPANT_FIELDS);
  if (!chat) {
    // The chat is normally created the moment a project gets both a lead
    // archaeologist and an excavation team (see the tender award flow), but
    // any project that got both fields set another way - directly seeded,
    // migrated, imported - would otherwise be stuck chat-less forever. Create
    // it lazily here so "assigned members get a chat" always holds.
    const created = await ensureChatForProject(project);
    if (!created) {
      res.status(404).json({ error: "No group chat exists for this project yet." });
      return null;
    }
    chat = await TeamChat.findById(created._id).populate("participants.user", PARTICIPANT_FIELDS);
  }

  const isAdmin = req.user.role === "admin";
  const isMember = isParticipant(chat, req.user._id);
  if (!isAdmin && !isMember) {
    res.status(403).json({ error: "You are not part of this project's group chat." });
    return null;
  }

  const isLead = String(project.lead_archaeologist) === String(req.user._id);
  return { project, chat, isAdmin, isMember, isLead };
}

async function unreadCountFor(chat, userId) {
  const me = chat.participants.find((p) => String(p.user?._id || p.user) === String(userId));
  return ChatMessage.countDocuments({
    chat: chat._id,
    sender: { $ne: userId },
    createdAt: { $gt: me?.last_read_at || new Date(0) },
  });
}

// GET /api/chats -> every group chat the current user belongs to
router.get("/", async (req, res) => {
  try {
    const chats = await TeamChat.find({ "participants.user": req.user._id })
      .populate("project", "p_name progress end_date")
      .sort({ updatedAt: -1 });

    const results = await Promise.all(
      chats.map(async (chat) => {
        const [lastMessage, unread] = await Promise.all([
          ChatMessage.findOne({ chat: chat._id }).sort({ createdAt: -1 }),
          unreadCountFor(chat, req.user._id),
        ]);
        return {
          _id: chat._id,
          project: chat.project,
          archived: chat.archived,
          participantCount: chat.participants.length,
          lastMessage: lastMessage
            ? { text: lastMessage.text, image: !!lastMessage.image, createdAt: lastMessage.createdAt, system: lastMessage.system }
            : null,
          unread,
        };
      })
    );

    res.json({ chats: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load your chats." });
  }
});

// GET /api/chats/unread-count -> drives the red badge on the navbar DM icon
router.get("/unread-count", async (req, res) => {
  try {
    const chats = await TeamChat.find({ "participants.user": req.user._id }).select("participants");
    const counts = await Promise.all(chats.map((chat) => unreadCountFor(chat, req.user._id)));
    res.json({ unread: counts.reduce((a, b) => a + b, 0) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load unread chat count." });
  }
});

// GET /api/chats/:projectId -> full detail + message history for one chat
router.get("/:projectId", async (req, res) => {
  const loaded = await loadChat(req, res);
  if (!loaded) return;
  const { project, chat, isAdmin, isLead } = loaded;

  const messages = await ChatMessage.find({ chat: chat._id }).sort({ createdAt: 1 }).populate("sender", "name nid role");

  res.json({
    project: { _id: project._id, p_name: project.p_name, end_date: project.end_date },
    chat,
    messages,
    permissions: { isAdmin, isLead, canManageParticipants: isAdmin || isLead },
  });
});

// POST /api/chats/:projectId/messages  { text, image }
router.post("/:projectId/messages", async (req, res) => {
  try {
    const loaded = await loadChat(req, res);
    if (!loaded) return;
    const { chat } = loaded;

    if (chat.archived) {
      return res.status(400).json({ error: "This chat is archived and no longer accepts new messages." });
    }

    const { text, image } = req.body;
    if (!text?.trim() && !image) {
      return res.status(400).json({ error: "Write a message or attach an image." });
    }

    const message = await ChatMessage.create({
      chat: chat._id,
      sender: req.user._id,
      text: (text || "").trim(),
      image: image || "",
    });

    // Bumps updatedAt so the chat list sorts this conversation to the top.
    await TeamChat.updateOne({ _id: chat._id }, { $set: { updatedAt: new Date() } });

    await message.populate("sender", "name nid role");
    res.status(201).json({ message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not send the message." });
  }
});

// POST /api/chats/:projectId/read -> clears the unread badge for this chat
router.post("/:projectId/read", async (req, res) => {
  const loaded = await loadChat(req, res);
  if (!loaded) return;

  await TeamChat.updateOne(
    { _id: loaded.chat._id, "participants.user": req.user._id },
    { $set: { "participants.$.last_read_at": new Date() } }
  );
  res.json({ message: "Marked as read." });
});

// POST /api/chats/:projectId/participants  { nid }
// Only the lead archaeologist or an admin can change who's in the chat.
router.post("/:projectId/participants", async (req, res) => {
  try {
    const loaded = await loadChat(req, res);
    if (!loaded) return;
    const { chat, isAdmin, isLead } = loaded;

    if (!isAdmin && !isLead) {
      return res.status(403).json({ error: "Only the lead archaeologist or an admin can add participants." });
    }
    if (chat.archived) {
      return res.status(400).json({ error: "This chat is archived and no longer accepts new members." });
    }

    const { nid } = req.body;
    if (!nid || !String(nid).trim()) {
      return res.status(400).json({ error: "Provide the member's registration ID (NID)." });
    }

    const user = await User.findOne({ nid: String(nid).trim() });
    if (!user) return res.status(404).json({ error: "No user found with that registration ID." });
    if (isParticipant(chat, user._id)) {
      return res.status(400).json({ error: "This person is already in the chat." });
    }

    chat.participants.push({ user: user._id, role: user.role, added_by: req.user._id });
    await chat.save();

    await ChatMessage.create({
      chat: chat._id,
      sender: req.user._id,
      system: true,
      text: `${req.user.name} added ${user.name} to the group chat.`,
    });

    res.status(201).json({ message: "Participant added." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not add that participant." });
  }
});

// DELETE /api/chats/:projectId/participants/:userId
router.delete("/:projectId/participants/:userId", async (req, res) => {
  try {
    const loaded = await loadChat(req, res);
    if (!loaded) return;
    const { chat, isAdmin, isLead } = loaded;

    if (!isAdmin && !isLead) {
      return res.status(403).json({ error: "Only the lead archaeologist or an admin can remove participants." });
    }
    if (chat.archived) {
      return res.status(400).json({ error: "This chat is archived and its membership can no longer be changed." });
    }

    const target = chat.participants.find((p) => String(p.user?._id || p.user) === req.params.userId);
    if (!target) return res.status(404).json({ error: "That person is not in this chat." });
    if (chat.participants.length <= 1) {
      return res.status(400).json({ error: "Cannot remove the only remaining participant." });
    }

    const removedName = target.user?.name || (await User.findById(req.params.userId).select("name"))?.name || "a member";
    chat.participants = chat.participants.filter((p) => String(p.user?._id || p.user) !== req.params.userId);
    await chat.save();

    await ChatMessage.create({
      chat: chat._id,
      sender: req.user._id,
      system: true,
      text: `${req.user.name} removed ${removedName} from the group chat.`,
    });

    res.json({ message: "Participant removed." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not remove that participant." });
  }
});

module.exports = router;
