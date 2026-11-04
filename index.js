import express from "express"
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config'
import cors from "cors"
const app = express()
const PORT = 8000
app.use(cors())
app.use(express.json())

const client = new MongoClient(process.env.MONGODB_URL);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}
 const mongoClient = await connectToMongoDB();
 const db = mongoClient.db("booknook")
 const bookCollection = db.collection("book")
 const borrowCollection = db.collection("borrows");


 app.post("/books", async(req,res) => {
  const data = req.body
  const result = await bookCollection.insertOne(data)
  console.log(result)
  res.send(result)
 })

 app.get("/books", async (req, res) => {
  const result = await bookCollection
    .find()
    .sort({ _id: -1 })
    .toArray();

  res.send(result);
});

app.get("/books/:id", async (req, res) => {
  const result = await bookCollection.findOne({
    _id: new ObjectId(req.params.id),
  });

  res.send(result);
});

app.get("/my-borrows", async (req, res) => {
  const email = req.query.email;

  const result = await borrowCollection
    .find({ userEmail: email })
    .toArray();

  res.send(result);
});

app.post("/borrows", async (req, res) => {
  const borrowData = req.body;

 
  const book = await bookCollection.findOne({
    _id: new ObjectId(borrowData.bookId),
  });

  if (!book || book.totalCopies <= 0) {
    return res.status(400).send({
      message: "Book is not available",
    });
  }

  
  const alreadyBorrowed = await borrowCollection.findOne({
    bookId: borrowData.bookId,
    userEmail: borrowData.userEmail,
  });

  if (alreadyBorrowed) {
    return res.status(400).send({
      message: "You have already borrowed this book",
    });
  }

  
  const result = await borrowCollection.insertOne(borrowData);

  // Decrease available copies
  await bookCollection.updateOne(
    { _id: new ObjectId(borrowData.bookId) },
    { $inc: { totalCopies: -1 } }
  );

  res.send(result);
});

//http://localhost:8000/books

app.get("/", (req,res)=> {
    res.send({message: `Server is running fine!`})
})
app.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`)
})