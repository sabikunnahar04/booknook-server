import express from "express"
import { MongoClient } from 'mongodb';
const app = express()
const PORT = 8000


const client = new MongoClient("mongodb://booknook:Y8rZbaI8JV0mp6T1@ac-xtleqqs-shard-00-00.0vokocr.mongodb.net:27017,ac-xtleqqs-shard-00-01.0vokocr.mongodb.net:27017,ac-xtleqqs-shard-00-02.0vokocr.mongodb.net:27017/?ssl=true&replicaSet=atlas-v7zj53-shard-0&authSource=admin");

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}
 connectToMongoDB()

//http://localhost:8000

app.get("/", (req,res)=> {
    res.send({message: `Server is running fine!`})
})
app.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`)
})