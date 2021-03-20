# File[Me]up / shady_file_upload

File upload service that just about works most of the time


## Setup

- Make sure php/configuration.php is pointing to a sane database. 
- Execute INIT_DATABASE.sql on that database
- make sure the directory $storage_root exists and PHP has write access to it
- Build the JavaScript

## Building the JavaScript

On Windows, just run `build.ps1'.

Otherwise, 
```
npm install # you only need to run this once
npx tsc
npx esbuild --bundle temp/main.js --outfile=build/bundle.js
```
