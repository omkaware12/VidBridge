if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const PORT = process.env.PORT || 8000;
const app = express();
const UserRoutes = require("./Routes/User");

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
//app.use("/api/v1/user", UserRoutes);

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/Vidbridge");
}

main()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.error("Could not connect to MongoDB", err));


app.use("/api/v1/user", UserRoutes);




app.get("/login" , (req , res)=>{
    res.send("Login Page");
})



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
