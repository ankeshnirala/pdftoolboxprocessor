import { Router, Request, Response } from "express";
import {exec} from "child_process";
import aws from "aws-sdk";
import fs from "fs"

import { promisify } from "util";

// import { upload } from "./../../middlewares/s3.fileupload"
import { BadRequestError } from "../../errors";


const router = Router();

// router
// .route("/sripts/upload")
// .post(upload.single("file"), async (req: Request, res: Response) => {    
//         res.status(200).json({status: 1, message: "success", data: []});
// });

export {router as scriptUploadRoute}
