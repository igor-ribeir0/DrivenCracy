import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import choiceRouter from "./routes/ChoiceRoutes.js";
import pollRouter from "./routes/PollRoutes.js";

dotenv.config();

const server = express();

server.use(cors());
server.use(express.json());
server.use([choiceRouter, pollRouter]);

server.listen(process.env.PORT);