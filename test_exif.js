const { exiftool } = require('exiftool-vendored');
const fs = require('fs');
const path = require('path');

const targetFile = 'C:\\Users\\davidtom\\Downloads\\Newfolder\\pexels-anjana-c-169994-674010.jpg';

async function test() {
    console.log(`Checking file existence: ${targetFile}`);
    if (!fs.existsSync(targetFile)) {
        console.error('File not found!');
        process.exit(1);
    }

    console.log('Checking write permissions...');
    try {
        fs.accessSync(targetFile, fs.constants.W_OK);
        console.log('File is writable.');
    } catch (err) {
        console.error('File is NOT writable:', err.message);
        process.exit(1);
    }

    console.log('Attempting to write metadata with exiftool...');
    try {
        const result = await exiftool.write(targetFile, {
            "ImageDescription": "Test Description from Debug Script",
            "XPComment": "Test Comment"
        });
        console.log('ExifTool success!');
        console.log(result);
    } catch (err) {
        console.error('ExifTool failed:', err);
    } finally {
        await exiftool.end();
    }
}

test();
