import io

from flask import Flask, jsonify, render_template, request, send_from_directory
from flask_cors import CORS
import PIL.Image
from ultralytics import YOLO

app = Flask(__name__, template_folder=".", static_folder=".")
CORS(app)

# Load custom trained YOLOv8 model
model = YOLO("best0.pt")

# Explicit mapping by integer class index (0 - 6)
CATEGORY_MAP = {
    0: {"label": "CAN", "bin": "can recycling"},
    1: {"label": "GLASS", "bin": "Glass bin"},
    2: {"label": "PAPER CUP", "bin": "Paper recycling"},
    3: {"label": "PET", "bin": "Blue bin"},
    4: {"label": "TETRA", "bin": "tetra recycling"},
    5: {"label": "TRASH", "bin": "trash bin"},
    6: {"label": "WRAPPER", "bin": "wrapper bin"},
}


@app.route("/", methods=["GET"])
def home():
  try:
    return render_template("index.html")
  except Exception:
    return jsonify({
        "status": "online",
        "message": (
            "YOLOv8 Object Detection API is running. Send POST requests to"
            " /predict."
        ),
    })


@app.route("/<path:filename>")
def serve_static(filename):
  return send_from_directory(".", filename)


@app.route("/predict", methods=["POST"])
def predict():
  if "file" not in request.files:
    return jsonify({"error": "No image uploaded"}), 400

  file = request.files["file"]

  try:
    # Read uploaded image
    image = PIL.Image.open(io.BytesIO(file.read()))

    # Run YOLOv8 inference
    results = model(image)

    detected_items = []
    bounding_boxes = []

    for box in results[0].boxes:
      # Extract integer class ID directly from YOLO box
      cls_id = int(box.cls[0].item())
      conf = float(box.conf[0].item())
      x1, y1, x2, y2 = box.xyxy[0].tolist()

      # Fallback to model's default name if ID isn't in 0-6 range
      default_label = (
          model.names[cls_id] if cls_id in model.names else f"class_{cls_id}"
      )

      # Extract mapped information via class index
      category_info = CATEGORY_MAP.get(
          cls_id, {"label": default_label, "bin": "General waste bin"}
      )

      display_label = category_info["label"]

      detected_items.append({"label": display_label, "confidence": conf})

      bounding_boxes.append({
          "x1": x1,
          "y1": y1,
          "x2": x2,
          "y2": y2,
          "label": display_label,
          "confidence": conf,
          "class_id": cls_id,
      })

    # Sort detections by confidence (highest first) to pick the recommended bin
    recommended_bin = "General waste bin"
    if bounding_boxes:
      bounding_boxes.sort(key=lambda item: item["confidence"], reverse=True)
      top_class_id = bounding_boxes[0]["class_id"]
      recommended_bin = CATEGORY_MAP.get(
          top_class_id, {"bin": "General waste bin"}
      )["bin"]

    return jsonify({
        "imageName": file.filename,
        "detectedItems": detected_items,
        "recommendedBin": recommended_bin,
        "summary": (
            f"Detected {len(detected_items)} item(s) using custom YOLOv8"
            " model."
        ),
        "boundingBoxes": bounding_boxes,
    })

  except Exception as e:
    print("Error during inference:", e)
    return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
  app.run(host="0.0.0.0", port=5000, debug=True)