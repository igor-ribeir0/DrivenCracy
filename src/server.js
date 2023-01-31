import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import joi from "joi";
import dayjs from "dayjs";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config();

const server = express();
const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

try{
    await mongoClient.connect();
    db = mongoClient.db();
}
catch(error){
    console.log("Connection Server Error");
}

server.use(cors());
server.use(express.json());
server.listen(process.env.PORT);

server.get("/poll", async(req, res) => {
    try{
        const getData = await db.collection("poll").find().toArray();
        return res.status(200).send(getData);
    }
    catch(error){
        return res.status(500).send(error.message);
    }
});

server.get("/poll/:id/choice", async(req, res) => {
    const { id } = req.params;

    try{
        const searchPoll = await db.collection("poll").findOne({ _id: ObjectId(id)});
        const getChoice = await db.collection("choice").find({ pollId: id}).toArray();

        if(!searchPoll){
            return res.status(404).send("Enquete inexistente.");
        }

        return res.status(200).send(getChoice);
    }
    catch(error){
        return res.status(500).send(error.message);
    }
});

server.post("/poll", async(req, res) => {
    const { title, expireAt } = req.body;
    const schema = joi.object({ title: joi.string().required() });
    const poll = { title };
    const validation = schema.validate(poll);
    let expire;

    if(validation.error){
        return res.status(422).send("Title não pode ser uma String vazia.");
    };

    if(expireAt.length === 0){
        expire = `30 days ${dayjs().format("HH:mm")}`;
    }
    else{
        expire = expireAt;
    }

    try{
        await db.collection("poll").insertOne({ title, expire });
        return res.sendStatus(201);
    }
    catch(error){
        return res.status(500).send(error.message);
    }

});

server.post("/choice", async(req, res) => {
    const { title, pollId } = req.body;
    const schema = joi.object(
        {
            title: joi.string().required(),
            pollId: joi.string().required()
        }
    );
    const choice = { title, pollId};
    const validation = schema.validate(choice, { abortEarly: false });

    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }

    try{
        const searchId = await db.collection("poll").findOne({ _id: ObjectId(pollId) });
        const searchChoiceTitle = await db.collection("choice").findOne({ title });

        if(!searchId){
            return res.status(404).send("Uma opção de voto não pode ser inserida sem uma enquete existente");
        }

        if(searchChoiceTitle){
            return res.status(409).send("Title já existente");
        }

        await db.collection("choice").insertOne(
            {
                title,
                pollId
            }
        );

        return res.sendStatus(201);
    }
    catch(error){
        return res.status(500).send(error.message);
    }
});

server.post("/choice/:id/vote", async(req, res) => {
    const { id } = req.params;

    try{
        const searchChoice = await db.collection("choice").findOne({ _id: ObjectId(id)});

        if(!searchChoice){
            return res.status(404).send("Opção inexistente.");
        }

        await db.collection("vote").insertOne(
            {
                createdAt: dayjs().format("YYYY-MM-DD HH:mm"),
                choiceId: id
            }
        );

        return res.sendStatus(201);
    }
    catch(error){
        return res.status(500).send(error,message);
    }
});