import axios from "axios";
import fs from "fs";
import path from "path";
import aws from "aws-sdk";

import { Queue, QueueStatus, PostProcessedFile } from "./../models";
import { S3FileDownloader } from "./s3.file.downloader";
import { PdfToolBoxProcessor } from "./PdfToolBoxProcessor";
import { io } from "./../app";

const {accessKeyId, secretAccessKey, AWS_BUCKET} = process.env;
aws.config.update({accessKeyId, secretAccessKey})

const CronFileProcessing = async() => {
    // enqueue a record
    const taskList = await Queue.findOne({queue_number: 0, status: QueueStatus.Waiting}).sort({createdAt: 1}).populate("pre_processed_file");
    
    // get last queue number
    const lastQueueNum = await Queue.findOne().sort({queue_number: -1});
    
    // check if there is a task in queue or not
    if(!taskList) {
        console.log("TASK NOT FOUND IN QUEUE.");
        return;
    }

    // if task found in queue the start processing it by updating status to processing
    // so that other cron job will not process same task
    taskList.status = QueueStatus.Processing;
    await taskList.save();

    // download processing file from s3 bucket and store it in local machine to process
    S3FileDownloader.download(taskList.pre_processed_file.s3file)
    .then(async (result) => {
        const projectRootPath = require('path').resolve('./');
        const fixedPath = "src/uploads";
        // get file name from s3 file url
        const s3fileSplitted = taskList.pre_processed_file.s3file.split("/");
        const fileName = s3fileSplitted[s3fileSplitted.length - 1];

        // get script and file path
        const scriptPath = `${projectRootPath}/src/scripts/${taskList.pre_processed_file.script_name}`;
        const filePath = `${projectRootPath}/${fixedPath}/${fileName}`;

        // process file in pdfToolBoxCli
        const processorResult = await PdfToolBoxProcessor.process(scriptPath, filePath, taskList.pre_processed_file.variables);
        if(processorResult == 0) {
            taskList.status = QueueStatus.Waiting;
            taskList.queue_number = lastQueueNum!.queue_number + 1;
        }else {
            // reading processed file
            const fileContent = fs.createReadStream(`${projectRootPath}/src/uploads/${processorResult}`);

            // params which can be sent to s3 to bucket
            const uploadParams = {
                Bucket: process.env.POSTPROCESSFILEBUCKET!,
                Key: processorResult,
                Body: fileContent,
                ACL: "public-read",
                ContentType: 'application/pdf',
            };
        
            // uploading processded file to s3
            await new aws.S3().upload(uploadParams).promise().then(async ({Location}) => {
                taskList.status = QueueStatus.Waiting;
                // store s3 response to database
                const resultData = await PostProcessedFile.build({s3file: Location, pre_processed_file: taskList.pre_processed_file}).save()
                taskList.status = QueueStatus.Complete;
                await taskList.save();
                await Queue.updateMany({status: QueueStatus.Waiting, queue_number: {$gt: 0}}, {$inc : {queue_number : -1}});

                // deleting processed and processing file from local machine
                fs.unlinkSync(`${projectRootPath}/src/uploads/${processorResult}`);
                fs.unlinkSync(`${projectRootPath}/${fixedPath}/${fileName}`);
                
                io.sockets.on('connection', function (socket) {     
                    socket.emit(resultData.pre_processed_file.id, resultData)             
                })

            }).catch(err => {
                taskList.status = QueueStatus.Waiting;
                taskList.queue_number = lastQueueNum!.queue_number + 1;
            });   
        }
        
    }).catch(() => {
        // if downloading from s3 bucket is failed then again we need to process the same
        // record to process it again
        taskList.status = QueueStatus.Waiting;
        taskList.queue_number = lastQueueNum!.queue_number + 1;
    });
    
    await taskList.save();    
};

export { CronFileProcessing };