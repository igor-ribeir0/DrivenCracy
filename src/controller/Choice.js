import joi from "joi";
import dayjs from "dayjs";
import db from "../config/dataBase.js";
import { ObjectId } from "mongodb";

export async function createChoice(req, res){
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
};

export async function choiceVote(req, res){
    const { id } = req.params;

    try{
        const searchChoice = await db.collection("choice").findOne({ _id: ObjectId(id)});
        const existVote = await db.collection("vote").findOne({ choiceId: id });
        const searchPoll = await db.collection("poll").findOne({ _id: ObjectId(searchChoice.pollId)});

        if(!searchChoice){
            return res.status(404).send("Opção inexistente.");
        }

        if(searchPoll.expireAt === dayjs().format("YYYY-MM-DD")){
            return res.sendStatus(403);
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
                    pollId: searchPoll._id,
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
};