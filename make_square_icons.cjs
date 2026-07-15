const Jimp = require('jimp');

async function makeSquare(inputFile, size, outputFile) {
  try {
    const image = await Jimp.read(inputFile);
    // Create a new square image with a white or transparent background
    const background = new Jimp(size, size, 0xffffffff); // White background
    
    // Calculate position to center the original image
    const x = (size - image.bitmap.width) / 2;
    const y = (size - image.bitmap.height) / 2;
    
    background.composite(image, x, y);
    await background.writeAsync(outputFile);
    console.log(`Successfully created ${outputFile} (${size}x${size})`);
  } catch (err) {
    console.error(`Error processing ${inputFile}:`, err);
  }
}

async function run() {
  await makeSquare('public/logo.png', 192, 'public/logo192.png');
  await makeSquare('public/logo.png', 512, 'public/logo512.png');
  await makeSquare('public/logo.png', 192, 'public/logo192_maskable.png');
  await makeSquare('public/logo.png', 512, 'public/logo512_maskable.png');
}

run();
