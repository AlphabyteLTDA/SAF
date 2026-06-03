const sharp = require('sharp');

async function processIcons() {
  try {
    const input = 'public/saflogobranco.png';
    console.log('Reading ' + input);

    // Trim removes transparent edges perfectly
    const trimmedBuffer = await sharp(input).trim().toBuffer();

    console.log('Generating 512x512...');
    // Resize to 450x450 to leave just a tiny 12% padding and extend to 512x512
    await sharp(trimmedBuffer)
      .resize(450, 450, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: 31, bottom: 31, left: 31, right: 31,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile('public/icon-512x512.png');

    console.log('Generating 192x192...');
    await sharp(trimmedBuffer)
      .resize(168, 168, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: 12, bottom: 12, left: 12, right: 12,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile('public/icon-192x192.png');

    console.log('Generating app/icon.png...');
    await sharp(trimmedBuffer)
      .resize(450, 450, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: 31, bottom: 31, left: 31, right: 31,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile('src/app/icon.png');

    console.log('Generating app/apple-icon.png...');
    await sharp(trimmedBuffer)
      .resize(160, 160, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: 10, bottom: 10, left: 10, right: 10,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile('src/app/apple-icon.png');

    console.log('Done!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

processIcons();
