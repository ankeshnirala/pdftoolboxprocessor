import "express-async-errors";
import express, { json } from "express";
import morgan from "morgan";
import aws from "aws-sdk";
import { createServer } from "http";
import path from "path";
import socketIO from "socket.io";

import { NotAuthError, NotFoundError } from "./errors";
import { errorHandler } from "./middlewares";
import { address } from "./configs/allowed.remote.address";

import { processPayloadRoute, processedPayloadRoute } from "./routers";

const baseURL = "/api/v1";
const app = express();
const server = createServer(app);
const io = new socketIO.Server(server);
declare module "express-serve-static-core" {
  interface Request {
    data?: any;
    status?: number;
    file?: any;
    s3Response?: Promise<aws.S3.ManagedUpload.SendData>
  }
}
app.set("trust proxy", true);
app.use(json());
app.use(morgan("tiny"));

app.use((req, res, next) => {
  
  const currentRemoteAddr = `${req.protocol}://${req.get('host')}`;
  const modifiedAddress = address.map(addr => `${addr}:${process.env.APP_PORT}`);
  const isAddrAllowed = modifiedAddress.includes(currentRemoteAddr);
  
  if(isAddrAllowed) return next();

  throw new NotAuthError();

});
app.use(baseURL, processPayloadRoute);
app.use(baseURL, processedPayloadRoute);

app.get('/', function(req, res){
   res.sendFile(path.join(__dirname+'/testSocket.html'));
});

app.all("*", () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { server, io };
