// Public archaeology Q&A. Guests browse read-only, public members ask and
// comment, archaeologists answer and can edit their own answers.
const express = require("express");
const Question = require("../models/Question");
const Answer = require("../models/Answer");
const QnAComment = require("../models/QnAComment");
const { requireAuth, requireRole, optionalAuth } = require("../middleware/auth");
const { notify, notifyRole } = require("../services/notify");

const router = express.Router();

const PROFILE_FIELDS = "name nid role roleProfile.affiliation roleProfile.specialization";
const MAX_IMAGES = 3;

// GET /api/qna/questions?q=&answered=true|false -> public browse/search
router.get("/questions", optionalAuth, async (req, res) => {
  try {
    const { q, answered } = req.query;
    const filter = {};
    if (q && String(q).trim()) filter.$text = { $search: String(q).trim() };
    if (answered === "true") filter.answeredCount = { $gt: 0 };
    if (answered === "false") filter.answeredCount = 0;

    const questions = await Question.find(filter)
      .populate("askedBy", PROFILE_FIELDS)
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load questions." });
  }
});

// GET /api/qna/my-questions -> a Public member's own asked questions
router.get("/my-questions", requireAuth, requireRole("public"), async (req, res) => {
  const questions = await Question.find({ askedBy: req.user._id }).sort({ createdAt: -1 });
  res.json({ questions });
});

// GET /api/qna/my-answers -> an archaeologist's own answers, editable from here
router.get("/my-answers", requireAuth, requireRole("archaeologist"), async (req, res) => {
  const answers = await Answer.find({ answeredBy: req.user._id })
    .populate({ path: "question", select: "title askedBy createdAt", populate: { path: "askedBy", select: "name" } })
    .sort({ createdAt: -1 });
  res.json({ answers });
});

// GET /api/qna/questions/:id -> full thread: question + answers + comments
router.get("/questions/:id", optionalAuth, async (req, res) => {
  const question = await Question.findById(req.params.id).populate("askedBy", PROFILE_FIELDS);
  if (!question) return res.status(404).json({ error: "Question not found." });

  const [answers, comments] = await Promise.all([
    Answer.find({ question: question._id }).populate("answeredBy", PROFILE_FIELDS).sort({ createdAt: 1 }),
    QnAComment.find({ question: question._id }).populate("author", PROFILE_FIELDS).sort({ createdAt: 1 }),
  ]);

  res.json({ question, answers, comments });
});

// POST /api/qna/questions  { title, body, images }  -> Public members only
router.post("/questions", requireAuth, requireRole("public"), async (req, res) => {
  try {
    const { title, body, images } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: "Give your question a title." });
    }

    const question = await Question.create({
      askedBy: req.user._id,
      title: String(title).trim(),
      body: body || "",
      images: Array.isArray(images) ? images.slice(0, MAX_IMAGES) : [],
    });

    // Let archaeologists know a question is waiting.
    await notifyRole(
      "archaeologist",
      {
        category: "qna",
        type: "qna.question.posted",
        title: "New public archaeology question",
        message: `${req.user.name} asked: "${question.title}"`,
        link: `/qna/${question._id}`,
        actionRequired: true,
      },
      [req.user._id]
    );

    res.status(201).json({ question });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not post your question." });
  }
});

// POST /api/qna/questions/:id/answers  { body }  -> Archaeologists only
router.post("/questions/:id/answers", requireAuth, requireRole("archaeologist"), async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ error: "Question not found." });

    const { body } = req.body;
    if (!body || !String(body).trim()) {
      return res.status(400).json({ error: "Write an answer before submitting." });
    }

    const answer = await Answer.create({
      question: question._id,
      answeredBy: req.user._id,
      body: String(body).trim(),
    });
    await Question.updateOne({ _id: question._id }, { $inc: { answeredCount: 1 } });

    if (String(question.askedBy) !== String(req.user._id)) {
      await notify({
        user: question.askedBy,
        category: "qna",
        type: "qna.question.answered",
        title: "Your question was answered",
        message: `${req.user.name} answered: "${question.title}"`,
        link: `/qna/${question._id}`,
      });
    }

    await answer.populate("answeredBy", PROFILE_FIELDS);
    res.status(201).json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not post your answer." });
  }
});

// PATCH /api/qna/answers/:id  { body }  -> only the archaeologist who wrote it
router.patch("/answers/:id", requireAuth, requireRole("archaeologist"), async (req, res) => {
  const answer = await Answer.findById(req.params.id);
  if (!answer) return res.status(404).json({ error: "Answer not found." });
  if (String(answer.answeredBy) !== String(req.user._id)) {
    return res.status(403).json({ error: "You can only edit your own answers." });
  }

  const { body } = req.body;
  if (!body || !String(body).trim()) {
    return res.status(400).json({ error: "Answer cannot be empty." });
  }

  answer.body = String(body).trim();
  answer.edited = true;
  await answer.save();
  res.json({ answer });
});

// POST /api/qna/questions/:id/comments  { body }  -> any logged-in user
router.post("/questions/:id/comments", requireAuth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ error: "Question not found." });

    const { body } = req.body;
    if (!body || !String(body).trim()) {
      return res.status(400).json({ error: "Write a comment before submitting." });
    }

    const comment = await QnAComment.create({
      question: question._id,
      author: req.user._id,
      body: String(body).trim(),
    });

    // Archaeologists watch the thread, and so does the asker.
    await notifyRole(
      "archaeologist",
      {
        category: "qna",
        type: "qna.comment.posted",
        title: "New comment on a Q&A question",
        message: `${req.user.name} commented on "${question.title}"`,
        link: `/qna/${question._id}`,
      },
      [req.user._id]
    );
    if (String(question.askedBy) !== String(req.user._id)) {
      await notify({
        user: question.askedBy,
        category: "qna",
        type: "qna.comment.posted",
        title: "New comment on your question",
        message: `${req.user.name} commented on "${question.title}"`,
        link: `/qna/${question._id}`,
      });
    }

    await comment.populate("author", PROFILE_FIELDS);
    res.status(201).json({ comment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not post your comment." });
  }
});

module.exports = router;
