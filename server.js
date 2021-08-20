const mongoose = require('mongoose');
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
)

// mongoose is an ODM(Object Data Modelling) for mongodb and Nodejs for 
// higher level of abstraction 
mongoose.connect(DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
}).then(console.log("DB connection successful"));



const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App is running on ${port}`);
});
