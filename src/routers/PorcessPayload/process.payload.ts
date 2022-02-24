import { Router, Request, Response } from "express";
import { BadRequestError } from "../../errors";

import { PreProcessedFile, Queue, QueueStatus } from "./../../models";

const router = Router();

router.route("/store/payload").post( async (req: Request, res: Response) => {
    // fetch required parameters from file and body
    const variables = req.body.variables;
    const s3file = req.body.s3file;
    const script_name = req.body.script_name;
    
    if(!(s3file && script_name)) {
        throw new BadRequestError("Please enter valid parameters");
    }

    // store payload data and s3 file path in database
    const payload = { s3file, script_name, variables }
    const result = await PreProcessedFile.build(payload).save();

    const queueResult = await Queue.find({$or: [{queue_number: 0, status: QueueStatus.Processing}, {queue_number: 0, status: QueueStatus.Waiting}]}).count();
    console.log(queueResult, "QUEUE SIZE");
    
    if(queueResult >= 4) {
        console.log("FROM IF");
        
        // add this task to queue with repective queue number if the queue size > 4
        // get queue number
        const lastQueueNum = await Queue.findOne().sort({queue_number: -1});
        const queueNumber = lastQueueNum!.queue_number + 1;
        const payload = { pre_processed_file: result.id, queue_number: queueNumber, status: QueueStatus.Waiting};

        await Queue.build(payload).save();
        await result.save();

        const getQueuedResult = await Queue.findOne({pre_processed_file: result.id}).populate("pre_processed_file");
        res.status(201).json({status: 1, message: "successfully created.", data: getQueuedResult});
    }else {
        console.log("FROM ELSE");
        
        // add this task to queue with queue number 0 if the queue size <= 4
        const payload = { pre_processed_file: result.id, queue_number: 0, status: QueueStatus.Waiting};

        await Queue.build(payload).save();
        await result.save();
        
        const getQueuedResult = await Queue.findOne({pre_processed_file: result.id}).populate("pre_processed_file");
        res.status(201).json({status: 1, message: "successfully created.", data: getQueuedResult});
    }

    /*

    // build command which execute and return processed file
    const command = `$HOME/callas_pdfToolboxCLI/pdfToolbox --setvariable=scale_pages_x:${scalePageX} --setvariable=scale_pages_y:${scalePageY} --setvariable=resize_art:${resizeArt} ${projectRootPath}/src/scripts/${scriptName}.${scriptExt} ${projectRootPath}/src/uploads/${fileName}`;

    try {
        // execute pdftoolbox command
        // console.log(command);
        const result = (await TERM_EXEC(command))
        console.log(result, "RESSSSSULTTT");
        
        // res.status(200).json({status: 1, message: "success", data: []});
        
        
    }catch(error: any) {
        console.log("ERRORRRR", error);
        

        // get name of processed file so that we can read from local storage and later delete it
        const splittedResult = error.stdout.split("Output")[1].split("Finished")[0].split("/");
        const finalSplittedResult = splittedResult[splittedResult.length - 1].replace("\t", "").replace("\n", "");
        
        // reading processed file
        const fileContent = fs.createReadStream(`${projectRootPath}/src/uploads/${fileName.split(".")[0]}_0001.${fileName.split(".")[1]}`);

        // params which can be sent to s3 to bucket
        const uploadParams = {
             Bucket: 'pdftoolboxprocessor', 
             Key: finalSplittedResult,
             Body: fileContent,
             ACL: "public-read",
             ContentType: 'application/pdf',
        };
    
        // uploading processded file
        const s3Response = await s3Client.upload(uploadParams).promise();

        // deleting processed and processing file
        fs.unlinkSync(`${projectRootPath}/src/uploads/${finalSplittedResult}`);
        fs.unlinkSync(`${projectRootPath}/src/uploads/${fileName}`);
        
        // send success response
        res.status(200).json({status: 1, message: "success", data: [], s3Response});
    }
    //  ./pdfToolbox --setvariable=scale_pages_x:6 --setvariable=scale_pages_y:12 --setvariable=resize_art:1 Abc.kfpx ScalingTest.pdf

    */
});

export {router as processPayloadRoute}




// $HOME/callas_pdfToolboxCLI/pdfToolbox 
// --setvariable=scale_pages_x:6 --setvariable=scale_pages_y:12 --setvariable=resize_art:1 
// /home/ankesh/OFFICE_WORK/DesignStudio/PDFToolBoxProcessor/src/scripts/script_1.kfpx 
// /home/ankesh/OFFICE_WORK/DesignStudio/PDFToolBoxProcessor/src/uploads/ScalingTest.pdf