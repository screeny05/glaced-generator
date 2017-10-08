import { promisify } from 'util';
import * as request from 'request';
import { parseString } from 'xml2js';
import * as mkdirp from 'mkdirp';
import * as rimraf from 'rimraf';
import { join as joinPath } from 'path';
import { writeFile, exists as fileExists } from 'fs';
import * as pMap from 'p-map';

const parseXmlPromise = promisify(parseString);

const get = async function(url: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        request(url, (err, response, body) => {
            if(err){ return reject(err); }
            return resolve(body);
        });
    });
};

const getXml = async function(url: string): Promise<any> {
    const xmlString = await get(url);
    return await parseXmlPromise(xmlString);
};

const downloadSvnFileList = async function(url: string, files: any[], filter: RegExp, targetDirectory: string, remainingRetries: number = 5){
    const failedDownloads: any = [];

    await pMap(files.filter(file => filter.test(file.$.name)), async file => {
        const fileName = file.$.name;
        const filePath = joinPath(targetDirectory, fileName);
        const fileAlreadExists = await promisify(fileExists)(filePath);

        if(fileAlreadExists){
            console.log('found', fileName);
            return;
        }

        console.log('load', fileName);

        try {
            const content = await get(url + '/' + file.$.href);
            await promisify(writeFile)(filePath, content);
        } catch(e) {
            failedDownloads.push(file);
        }
    }, { concurrency: 5 });

    if(failedDownloads.length > 0 && remainingRetries > 0){
        console.log('retry', failedDownloads.map(file => file.$.name).join(', '), remainingRetries + ' retries left');
        await downloadSvnFileList(url, failedDownloads, filter, targetDirectory, remainingRetries--);
    }

    if(failedDownloads.length > 0 && remainingRetries === 0){
        throw new Error('NetworkError: Unable to load ' + failedDownloads.map(file => file.$.name).join(', '));
    }
};

export async function downloadSvnDirectory(url: string, filter: RegExp, targetDirectory: string, writeRevisionFile: boolean = false): Promise<any> {
    const directory = await getXml(url);
    const index = directory.svn.index[0];
    const { file, dir } = index;

    await promisify(mkdirp)(targetDirectory);

    if(writeRevisionFile){
        await promisify(writeFile)(joinPath(targetDirectory, 'revision'), index.$.rev);
    }

    await downloadSvnFileList(url, file, filter, targetDirectory);

    return index.$.rev;
};
