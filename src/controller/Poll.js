import joi from "joi";
import dayjs from "dayjs";
import db from "../config/dataBase.js";
import { ObjectId } from "mongodb";

export async function listPoll(req, res){
    try{
        const getData = await db.collection("poll").find().toArray();
        return res.status(200).send(getData);
    }
    catch(error){
        return res.status(500).send(error.message);
    }
};

export async function listPollChoices(req, res){
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
};

export async function pollResult(req, res){
    const { id } = req.params;
    let moreVoted;
    let inicialVote = 0;

    try{
        const searchPoll = await db.collection("poll").findOne({ _id: ObjectId(id)});
        const getVotes = await db.collection("vote").find({ pollId: ObjectId(id) }).toArray();

        if(!searchPoll){
            return res.status(404).send("Enquete inexistente.");
        }

        getVotes.map(option => {
            if(option.vote > inicialVote){
                moreVoted = option;
                inicialVote = option.vote;
            }
        });

        const voteData = {
            _id: id,
            title: searchPoll.title,
            expireAt: searchPoll.expireAt,
            result:{
                title: moreVoted.title,
                votes: moreVoted.vote
            }
        }

        return res.status(200).send(voteData);
    }
    catch(error){
        return res.status(500).send(error.message);
    }
};

export async function createPoll(req, res){
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
};