const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

require("dotenv").config();

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

const uri = `mongodb+srv://${process.env.DB_Username}:${process.env.DB_Password}@cluster0.hzlter2.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const database = client.db("dataDB");
    const users = database.collection("users");
    const donation = database.collection("dationFood");

    app.get("/donation/food", async (req, res) => {
      const cursor = donation.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/user", async (req, res) => {
      const cursor = users.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/user/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { email: id };
        const result = await users.findOne(query);
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    app.post("/addUser", async (req, res) => {
      try {
        const user = req.body;
        console.log(user);
        const result = await users.insertOne(user);
        console.log(
          `A document was inserted with the _id: ${result.insertedId}`
        );
        res.send(result);
      } catch (error) {
        res.send(error);
      }
    });

    // json web token
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      res.cookie("token", token, {
        httpOnly: false,
        secure: true,
        sameSite: "none",
      });
      res.send(token);
    });

    app.post("/clear", async (req, res) => {
      res.clearCookie("token", { maxAge: 0, sameSite: "none", secure: true });
      res.send({ success: true });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);