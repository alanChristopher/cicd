import dotenv from "dotenv";
dotenv.config()
import app from './app.js'
const PORT = process.env.PORT;

app.listen(PORT, (error) => {
  if (error) {
    throw new Error(error);
  }
  console.log(`Listening to the server on port ${PORT}`);
});
