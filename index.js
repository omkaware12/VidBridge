if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");


const PORT = process.env.PORT || 8000;
const app = express();
const UserRoutes = require("./Routes/User");
const googleroutes = require("./Routes/googleroutes")
const projectRoutes = require("./Routes/projectRoute")
const ProfileRoute = require("./Routes/profileRoute");
const PaymentRoute = require("./Routes/PaymentRoute");
const {stripeWebhook} = require("./Controllers/PaymentController")
const ExpressError = require("./middleware/expressError");



app.use(cors({
  origin: "http://localhost:5173", // your frontend address
  credentials: true // if you use cookies or auth headers
}));





app.use(express.json()); // ✅ Parses JSON body
app.use(express.urlencoded({ extended: true })); // ✅ Parses form data
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
app.use("/api/v1/google", googleroutes);
app.use("/api/v1/project", projectRoutes);
app.use("/api/v1/profile" , ProfileRoute);
app.use("/api/v1/payments", PaymentRoute);


app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong";

  res.status(statusCode).json({
    status: false,
    error: message,
    
  });
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
