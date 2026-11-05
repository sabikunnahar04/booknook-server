import express from "express"
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config'
import cors from "cors"
import { createRemoteJWKSet, jwtVerify } from "jose";
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

const JWKS = createRemoteJWKSet(
  new URL("/api/auth/jwks", "http://localhost:3000")
);

const verifyApi = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({
      message: "Unauthorized!",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const { payload } = await jwtVerify(token, JWKS);

    req.user = payload;

    next();
  } catch (error) {
    console.log("JWT verification failed:", error);

    return res.status(401).send({
      message: "Invalid or expired token",
    });
  }
};
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

app.get("/books/:id", verifyApi, async (req, res) => {
  const result = await bookCollection.findOne({
    _id: new ObjectId(req.params.id),
  });

  res.send(result);
});

app.patch("/books/:id", async (req, res) => {
  const bookId = req.params.id;
  const email = req.query.email;

  if (!ObjectId.isValid(bookId)) {
    return res.status(400).send({
      message: "Invalid book ID",
    });
  }

  const { title, author, image, description, category, totalCopies } =
    req.body;

  const result = await bookCollection.updateOne(
    {
      _id: new ObjectId(bookId),
      addedBy: email,
    },
    {
      $set: {
        title,
        author,
        image,
        description,
        category,
        totalCopies: Number(totalCopies),
      },
    }
  );

  if (result.matchedCount === 0) {
    return res.status(404).send({
      message: "Book not found",
    });
  }

  res.send({
    message: "Book updated successfully",
  });
});

app.delete("/books/:id", async (req, res) => {
  const bookId = req.params.id;
  const email = req.query.email;

  if (!ObjectId.isValid(bookId)) {
    return res.status(400).send({
      message: "Invalid book ID",
    });
  }

  const result = await bookCollection.deleteOne({
    _id: new ObjectId(bookId),
    addedBy: email,
  });

  if (result.deletedCount === 0) {
    return res.status(404).send({
      message: "Book not found",
    });
  }

  res.send({
    message: "Book deleted successfully",
  });
});

app.get("/my-books", verifyApi, async (req, res) => {
  const email = req.query.email;

  const result = await bookCollection
    .find({ addedBy: email })
    .sort({ _id: -1 })
    .toArray();

  res.send(result);
});

app.get("/my-borrows", verifyApi, async (req, res) => {
  const email = req.query.email;

  const result = await borrowCollection
    .find({ userEmail: email })
    .toArray();

  res.send(result);
});

app.post("/borrows", verifyApi, async (req, res) => {
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

  
  await bookCollection.updateOne(
    { _id: new ObjectId(borrowData.bookId) },
    { $inc: { totalCopies: -1 } }
  );

  res.send(result);
});

app.delete("/borrows/:id", verifyApi, async (req, res) => {
  const borrowId = req.params.id;

  if (!ObjectId.isValid(borrowId)) {
    return res.status(400).send({
      message: "Invalid borrow ID",
    });
  }

  const borrow = await borrowCollection.findOne({
    _id: new ObjectId(borrowId),
  });

  if (!borrow) {
    return res.status(404).send({
      message: "Borrow record not found",
    });
  }

 
  await borrowCollection.deleteOne({
    _id: new ObjectId(borrowId),
  });

 
  await bookCollection.updateOne(
    { _id: new ObjectId(borrow.bookId) },
    { $inc: { totalCopies: 1 } }
  );

  res.send({
    message: "Book returned successfully",
  });
});
//http://localhost:8000/books

app.get("/", (req,res)=> {
    res.send({message: `Server is running fine!`})
})
app.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`)
})