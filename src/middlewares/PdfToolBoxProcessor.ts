import fs from "fs";
import {promisify} from "util";
import { exec } from "child_process";

const TERM_EXEC = promisify(exec);

export class PdfToolBoxProcessor {
    static process = async (scriptPath: string, filePath: string, variables: any) => {
        // build command which execute and return processed file
        
        let variableSetting = "--setvariable=";
        variableSetting += Object.keys(variables).map(key => `${key}:${variables[key]}`).join(" --setvariable=");

        const command = `$HOME/callas_pdfToolboxCLI/pdfToolbox ${variableSetting} ${scriptPath} ${filePath}`;
        console.log(command);
        
        // // execute pdftoolbox command
        
        console.log("PROCESSING....");

        try {
            await TERM_EXEC(command)

        }catch(error: any) {

            if(error && !error.stdout) return 0;
            if(error && error.stderr) return 0;

            const splittedResult = error.stdout.split("Output")[1].split("Finished")[0].split("/");
            const finalSplittedResult = splittedResult[splittedResult.length - 1].replace("\t", "").replace("\n", "");
            
            return finalSplittedResult;
        }
    }
}