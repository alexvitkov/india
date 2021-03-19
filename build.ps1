if (-Not Test-Path node_modules)
    npm install

# Clear the old build
Remove-Item -LiteralPath "temp"  -Force -Recurse | out-null
Remove-Item -LiteralPath "build" -Force -Recurse | out-null

echo "build.ps1: Running the Microsoft(R) TypeScript(TM) Compiler. This will take a while!"

# Call the typescript compiler, this will output a bunch of js files in the 'temp' folder
npx tsc
if (-Not $?) {
    echo "build.ps1: The Microsoft(R) TypeScript(TM) Compiler failed :("
    exit 1
}

echo "build.ps1: Running the bundler"

mkdir build | out-null
npx esbuild --bundle temp/main.js --outfile=build/bundle.js
if (-Not $?) {
    echo "build.ps1: The bundler failed. unlucky"
    exit 1
}

echo "build.ps1: Build successful!"