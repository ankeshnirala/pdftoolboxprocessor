import { Router, Request, Response } from "express";
import { BadRequestError } from "../../errors";

import { PostProcessedFile, Queue, QueueStatus } from "./../../models";

const router = Router();

router.route("/processed/payload/:id").get( async (req: Request, res: Response) => {
    const id = req.params.id;
    const checkPayloadInQueue = await Queue.findOne({pre_processed_file: id}).populate("pre_processed_file");

    if(!checkPayloadInQueue) {
        throw new BadRequestError("Please upload your file again.");
    }

    if(checkPayloadInQueue.status != QueueStatus.Complete) {
        return res.status(200).json({status: 1, message: "success", data: checkPayloadInQueue});
    }    

    const processedPayload = await PostProcessedFile.findOne({pre_processed_file: id}).populate("pre_processed_file");

    return res.status(200).json({status: 1, message: "success", data: processedPayload});
});

export {router as processedPayloadRoute}
