import express from "express";
import bodyParser from "body-parser";

const appbase: express.Express = express();
const expressWs = require("express-ws")(appbase);
const { app } = expressWs;
const { game, router } = require("./game");

appbase.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
appbase.use(bodyParser.json());

// CORSの許可
appbase.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "PUT, DELETE");
  next();
});

appbase.use("/", router);

app.ws("/game", game);

app.listen(3000, () => {
  console.log("Listen started at port 3000.");
});

export default app;
