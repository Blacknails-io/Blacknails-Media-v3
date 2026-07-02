import { execFile } from 'child_process';
import { promisify } from 'util';
import { DetectedFace, IFaceDetectionService } from '../../../application/ports/out/IFaceDetectionService.js';

const execFileAsync = promisify(execFile);

export class PythonFaceDetectionService implements IFaceDetectionService {
  constructor(private readonly pythonBin: string = 'python3') {}

  public async detect(imagePath: string): Promise<DetectedFace[]> {
    const script = `
import json
import sys
import cv2
import os

image_path = sys.argv[1]
img = cv2.imread(image_path)
if img is None:
    print("[]")
    sys.exit(0)

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
cascade_candidates = []
if hasattr(cv2, "data") and hasattr(cv2.data, "haarcascades"):
    cascade_candidates.append(os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml"))
cascade_candidates.extend([
    "/usr/share/opencv4/haarcascades/haarcascade_frontalface_default.xml",
    "/usr/share/opencv/haarcascades/haarcascade_frontalface_default.xml",
])
cascade_path = next((p for p in cascade_candidates if os.path.exists(p)), None)
if not cascade_path:
    raise RuntimeError("Haar cascade file not found for face detection.")
detector = cv2.CascadeClassifier(cascade_path)
faces = detector.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=11, minSize=(30, 30))

result = []
if faces is not None and len(faces) > 0:
    # Sort by face box area descending to prioritize closer/larger faces
    sorted_faces = sorted(list(faces), key=lambda f: f[2] * f[3], reverse=True)
    
    # Define minimum pixel sizes based on image dimensions (e.g., at least 3% of the image size)
    min_w = max(30, int(img.shape[1] * 0.03))
    min_h = max(30, int(img.shape[0] * 0.03))
    
    # Filter and keep up to 8 largest faces
    count = 0
    for (x, y, w, h) in sorted_faces:
        if w < min_w or h < min_h:
            continue
        if count >= 8:
            break
            
        # Calculate BGR color histograms of top and bottom halves of the face crop to represent identity details
        face_crop = img[max(0, y):min(img.shape[0], y+h), max(0, x):min(img.shape[1], x+w)]
        if face_crop.size > 0:
            h_crop, w_crop, _ = face_crop.shape
            top_half = face_crop[0:int(h_crop/2), :]
            bottom_half = face_crop[int(h_crop/2):, :]
            
            def get_hist_features(half):
                if half.size > 0:
                    features = []
                    for channel in range(3):
                        hist = cv2.calcHist([half], [channel], None, [8], [0, 256])
                        cv2.normalize(hist, hist, 1.0, 0.0, cv2.NORM_L1)
                        features.extend([float(val[0]) for val in hist])
                    return features
                else:
                    return [0.125] * 24
            
            embedding = get_hist_features(top_half) + get_hist_features(bottom_half)
        else:
            embedding = [0.125] * 48

        result.append({
            "bbox": [int(x), int(y), int(w), int(h)],
            "confidence": 0.85,
            "embedding": embedding
        })
        count += 1

print(json.dumps(result))
`;

    const candidates = [this.pythonBin, 'python3', 'python'].filter((value, index, self) => value && self.indexOf(value) === index);
    let lastError: unknown;
    for (const python of candidates) {
      try {
        const raw = await execFileAsync(python, ['-c', script, imagePath], { maxBuffer: 1024 * 1024 });
        const parsed = JSON.parse((raw.stdout || '[]').trim()) as DetectedFace[];
        return Array.isArray(parsed) ? parsed : [];
      } catch (error: any) {
        lastError = error;
        if (error?.code !== 'ENOENT') {
          const stderr = typeof error?.stderr === 'string' ? error.stderr.trim() : '';
          const shortStderr = stderr ? stderr.split('\n').at(-1) : '';
          throw new Error(`Face detection failed using ${python}: ${shortStderr || error?.message || 'unknown error'}`);
        }
      }
    }

    const lastMessage = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(`No Python interpreter available for face detection (tried: ${candidates.join(', ')}). Last error: ${lastMessage}`);
  }
}
