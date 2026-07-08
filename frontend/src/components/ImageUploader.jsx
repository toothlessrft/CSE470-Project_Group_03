import { useRef } from "react";

const MAX_IMAGES = 3;

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ImageUploader({ images, onChange }) {
  const inputRef = useRef(null);

  async function handleFiles(e) {
    const MAX_SIZE = 1024 * 1024; // 1 MB

    const files = Array.from(e.target.files || []).filter(file => file.size <= MAX_SIZE).slice(0, MAX_IMAGES - images.length);

    if (files.length === 0) {
      alert("Please upload images smaller than 1 MB.");
      return;
    }
    const dataUrls = await Promise.all(files.map(fileToDataUrl));
    onChange([...images, ...dataUrls]);
    e.target.value = "";
    
  }

  function removeAt(index) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className="image-uploader">
      <div className="image-grid">
        {images.map((src, i) => (
          <div className="image-thumb" key={i}>
            <img src={src} alt={`upload-${i}`} />
            <button type="button" className="image-remove" onClick={() => removeAt(i)}>
              ×
            </button>
          </div>
        ))}
        {images.length < MAX_IMAGES && (
          <button type="button" className="image-add" onClick={() => inputRef.current?.click()}>
            + Add photo
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleFiles}
      />
      <p className="hint">Up to {MAX_IMAGES} photos of the artifact/find.</p>
    </div>
  );
}
