function createImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('That file is not a valid image.'))
    img.src = url
  })
}

// Reads a File and returns a data URL (used to feed the crop preview).
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the file.'))
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })
}

// Crops the region the user selected (pixel coords from react-easy-crop) out of
// the source image and downscales it to a square JPEG Blob.
export async function getCroppedBlob(imageSrc, cropPixels, size = 256) {
  const img = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.drawImage(
    img,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    size,
    size
  )
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not process the image.'))),
      'image/jpeg',
      0.85
    )
  )
}

// Center-crops an image file to a square and downscales it, returning a JPEG
// Blob. Keeps avatar uploads small and fast regardless of the source image.
export function resizeImageToBlob(file, size = 256) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That file is not a valid image.'))
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        // Cover-crop: use the largest centered square of the source.
        const min = Math.min(img.width, img.height)
        const sx = (img.width - min) / 2
        const sy = (img.height - min) / 2
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size)
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Could not process the image.'))),
          'image/jpeg',
          0.85
        )
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
