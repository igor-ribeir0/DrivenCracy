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

server.get("/poll/:id/result", async(req, res) => {
    const { id } = req.params;
    const voteList = [];

    try{
        const searchPoll = await db.collection("poll").findOne({ _id: ObjectId(id)});
        const getChoices = await db.collection("choice").find({ pollId: id }).toArray();

        if(!searchPoll){
            return res.status(404).send("Enquete inexistente.");
        }

        /*getChoices.map(async(choice) => {
            voteList.push(await db.collection("vote").find({ choiceId: choice._id}));
        })
        console.log(voteList);
        */

        const voteData = {
            _id: id,
            title: searchPoll.title,
            expireAt: searchPoll.expire,
            result:{
                title: "lalala",
                votes: 21
            }
        }

        return res.status(200).send(voteData);
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
    let monthExpire = Number(dayjs().format("MM"));
    let expire;

    if(validation.error){
        return res.status(422).send("Title não pode ser uma String vazia.");
    };

    if(monthExpire + 1 === 13){
        monthExpire = "01";
    }
    else if(monthExpire + 1 <= 9){
        monthExpire = `0${monthExpire + 1}`;
    }
    else{
        monthExpire = monthExpire + 1;
    }

    if(expireAt.length === 0){
        expire = dayjs().format(`YYYY-${monthExpire}-DD HH:mm`);
    }
    else{
        expire = expireAt;
    }

    try{
        await db.collection("poll").insertOne({ title, expireAt: expire });
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

        if(searchId.expireAt === dayjs().format("YYYY-MM-DD")){
            return res.sendStatus(403);
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
        const existVote = await db.collection("vote").findOne({ choiceId: id });

        if(!searchChoice){
            return res.status(404).send("Opção inexistente.");
        }

        if(existVote){
            await db.collection("vote").updateOne(
                { _id: ObjectId(existVote._id) },
                { $inc: { vote: 1 } }
            );
        }
        else{
            await db.collection("vote").insertOne(
                {
                    createdAt: dayjs().format("YYYY-MM-DD HH:mm"),
                    choiceId: id,
                    title: searchChoice.title,
                    vote: 1
                }
            );
        }

        return res.sendStatus(201);
    }
    catch(error){
        return res.status(500).send(error,message);
    }
});

server.get("/vote", async(req, res) => {
    const getVote = await db.collection("vote").find().toArray();
    return res.send(getVote);
});