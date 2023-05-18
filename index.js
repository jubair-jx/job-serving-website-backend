const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const PORT = process.env.PORT || 4000;
require("dotenv").config();

//middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Bruh, You Job serving website server is running");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.udnr6tc.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
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

    client.connect();
    //job collection
    const jobCollection = client.db("jobPortal").collection("jobs");

    const indexKeys = { title: 1, category: 1 };
    const indexOptions = { name: "titleCategory" };

    const result = await jobCollection.createIndex(indexKeys, indexOptions);

    app.get("/jobSearch/:text", async (req, res) => {
      const searchText = req.params.text;
      const result = await jobCollection
        .find({
          $or: [
            { title: { $regex: searchText, $options: "i" } },
            { category: { $regex: searchText, $options: "i" } },
          ],
        })
        .toArray();
      res.send(result);
    });

    app.post("/postJob", async (req, res) => {
      const body = req.body;
      body.createdAt = new Date();
      console.log(body);
      //   if (!body) {
      //     return res.status(404).send("Your Data isn't Found");
      //   }
      const result = await jobCollection.insertOne(body);
      console.log(result);
      res.send(result);
    });
    app.get("/allJob/:text", async (req, res) => {
      console.log(req.params.text);
      if (req.params.text == "remote" || req.params.text == "offline") {
        const result = await jobCollection
          .find({ status: req.params.text })
          .sort({ createdAt: -1 })
          .toArray();
        return res.send(result);
      } else {
        const result = await jobCollection
          .find({})
          .sort({ createdAt: -1 })
          .toArray();
        res.send(result);
      }
    });
    app.get("/myJob/:email", async (req, res) => {
      console.log(req.params.email);
      const find = await jobCollection
        .find({ postedBy: req.params.email })
        .toArray();
      res.send(find);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(PORT, (req, res) => {
  console.log(`Your server is running on PORT: ${PORT}`);
});
