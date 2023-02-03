import { listPoll, listPollChoices, pollResult, createPoll } from "../controller/Poll.js";
import { Router } from "express";

const pollRouter = Router();

pollRouter.get("/poll", listPoll);
pollRouter.get("/poll/:id/choice", listPollChoices);
pollRouter.get("/poll/:id/result", pollResult);
pollRouter.post("/poll", createPoll);

export default pollRouter;