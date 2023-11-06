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
    origin: ["http://localhost:5173", "https://donation-af25b.web.app"],
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
    const foodRequest = database.collection("Food Request");

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

    app.get("/donation/food/search", async (req, res) => {
      try {
        const searchQuery = req.query.query;

        const query = {
          $or: [
            { food_name: { $regex: searchQuery, $options: "i" } },
            { "donator.email": { $regex: searchQuery, $options: "i" } },
          ],
        };

        const cursor = donation.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } catch (err) {
        console.log(err);
        res
          .status(500)
          .send({ error: "An error occurred while searching donations." });
      }
    });

    app.delete("/donation/food/clear/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await donation.deleteOne(query);
        res.send(result);
      } catch (err) {
        console.log(err);
        res.send(err);
      }
    });

    app.get("/donation/food/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await donation.findOne(query);
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });
    app.get("/donation/manage/food", async (req, res) => {
      try {
        const searchQuery = req.query.query;
        const query = {
          $or: [{ food_id: { $regex: searchQuery, $options: "i" } }],
        };
        const cursor = await foodRequest.findOne(query);

        res.send(cursor);
      } catch (err) {
        console.log(err);
      }
    });
    app.get("/donation/manage/food/search", async (req, res) => {
      try {
        const searchQuery = req.query.query;
        const query = {
          $or: [{ food_id: { $regex: searchQuery, $options: "i" } }],
        };
        const cursor = await foodRequest.find(query);
        const result = await cursor.toArray();

        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });
    app.delete("/donation/manage/food/clear/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = {
          $or: [{ food_id: { $regex: id, $options: "i" } }],
        };
        const result = await foodRequest.deleteMany(query);
        res.send(result);
      } catch (err) {
        console.log(err);
        res.send(err);
      }
    });

    app.post("/donation/add/food", async (req, res) => {
      try {
        const food = req.body;
        const result = await donation.insertOne(food);
        console.log(
          `A document was inserted with the _id: ${result.insertedId}`
        );

        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });
    app.post("/donation/food/request", async (req, res) => {
      try {
        const food = req.body;
        const result = await foodRequest.insertOne(food);
        console.log(
          `A document was inserted with the _id: ${result.insertedId}`
        );
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
