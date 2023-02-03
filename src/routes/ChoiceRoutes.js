import { createChoice, choiceVote } from "../controller/Choice.js";
import { Router } from "express";

const choiceRouter = Router();

choiceRouter.post("/choice", createChoice);
choiceRouter.post("/choice/:id/vote", choiceVote);

export default choiceRouter;