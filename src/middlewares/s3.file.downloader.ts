import {Request, Response, NextFunction} from "express";
import aws from "aws-sdk";
import path from "path";
import fs from "fs";

const { accessKeyId, secretAccessKey } = process.env;
aws.config.update({accessKeyId, secretAccessKey})

export class S3FileDownloader {
    static download = (filePath: string) => {
        const projectRootPath = require('path').resolve('./');
        const fixedPath = "src/uploads";

        const s3fileSplitted = filePath.split("/");
        const fileName = s3fileSplitted[s3fileSplitted.length - 1];
        
        const s3Params = {
             Bucket: process.env.PREPROCESSEDFILEBUCKET!,
             Key: fileName,
        };

        const filePromise = new Promise((resolve, reject) => {

                const readStream = new aws.S3().getObject(s3Params).createReadStream();
                readStream.on("error", (error) => {
                    return reject(0);
                })

                const writeStream = fs.createWriteStream(path.join(`${projectRootPath}/${fixedPath}/`, fileName));
                readStream.pipe(writeStream).on("finish", () => resolve(1));       
        });

        return filePromise;
    }
}