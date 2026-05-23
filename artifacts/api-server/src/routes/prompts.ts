import { Router } from "express";

const router = Router();

const PROMPTS = [
  "What small moment made you smile today?",
  "Who showed you kindness recently?",
  "What is something simple you often overlook but are grateful for?",
  "What challenged you today, and what did it teach you?",
  "Name one thing about your body or health you are thankful for.",
  "What beauty did you notice in the world today?",
  "Who in your life are you most grateful for right now, and why?",
  "What opportunity came your way today, big or small?",
  "What made you feel at peace today?",
  "What is something you accomplished recently that you are proud of?",
  "Name a place that brings you comfort. What do you love about it?",
  "What song, book, or piece of art are you grateful exists?",
  "What conversation left you feeling good today?",
  "What is a simple pleasure you enjoyed recently?",
  "Who has shaped the person you are today?",
  "What is something that used to be hard but now comes easily to you?",
  "What are you looking forward to tomorrow?",
  "What made you laugh or feel light today?",
  "What is something in your home you are grateful for?",
  "What part of your daily routine brings you comfort?",
  "What skill or talent are you glad you have?",
  "What moment from this week will you carry with you?",
  "What is one thing you would tell your past self to appreciate more?",
  "Who reached out to you today, and how did that make you feel?",
  "What is a challenge you have overcome that made you stronger?",
];

router.get("/prompts/daily", (_req, res) => {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const prompt = PROMPTS[dayOfYear % PROMPTS.length];
  res.json({ prompt });
});

export default router;
