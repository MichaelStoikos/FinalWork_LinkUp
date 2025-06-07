export function addWatermarkToImage(imageUrl, watermarkText = 'PREVIEW') {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      ctx.font = `${Math.floor(canvas.width / 12)}px sans-serif`;
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(watermarkText, canvas.width / 2, canvas.height / 2);
      resolve(canvas.toDataURL());
    };
    img.src = imageUrl;
  });
}
