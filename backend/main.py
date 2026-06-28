"""
GEE Cloud Pipeline — Plantation Tracker v1
DAE Kurigram · KrishiAI Team

Google Earth Engine Cloud Function for NDVI/EVI analysis.
Deploy via: gcloud functions deploy run_ndvi_pipeline --runtime python311 --trigger-http
"""

import json
import os
from datetime import datetime
from typing import Any

import ee
import functions_framework
from flask import Request, jsonify

# Initialize Earth Engine (assumes service account auth in Cloud Run env)
ee.Initialize()

# Constants
S2_COLLECTION = "COPERNICUS/S2_SR_HARMONIZED"
CLOUD_THRESHOLD = 20  # Max cloud cover percentage
SCALE_METERS = 10  # Analysis resolution in meters


def validate_request(body: dict) -> tuple[bool, str]:
    """Validate incoming pipeline request payload."""
    required = ["bounds", "date_from", "date_to"]
    for field in required:
        if field not in body:
            return False, f"Missing required field: {field}"

    bounds = body["bounds"]
    if not isinstance(bounds, list) or len(bounds) < 2:
        return False, "bounds must be a list of [lat, lon] pairs"

    try:
        datetime.strptime(body["date_from"], "%Y-%m-%d")
        datetime.strptime(body["date_to"], "%Y-%m-%d")
    except ValueError:
        return False, "date_from and date_to must be YYYY-MM-DD format"

    return True, ""


def create_region(bounds: list) -> ee.Geometry:
    """
    Create EE Geometry from bounds array.

    Expected bounds format: [[lat, lon], [lat, lon], ...]
    Converts to: ee.Geometry.Rectangle([min_lon, min_lat, max_lon, max_lat])
    """
    lats = [p[0] for p in bounds]
    lons = [p[1] for p in bounds]

    return ee.Geometry.Rectangle([
        min(lons), min(lats),  # min lon, min lat
        max(lons), max(lats),  # max lon, max lat
    ])


def calculate_indices(image: ee.Image) -> ee.Image:
    """Add NDVI and EVI bands to Sentinel-2 image."""
    ndvi = image.normalizedDifference(["B8", "B4"]).rename("NDVI")

    evi = image.expression(
        "2.5 * (NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1)",
        {
            "NIR": image.select("B8"),
            "RED": image.select("B4"),
            "BLUE": image.select("B2"),
        }
    ).rename("EVI")

    return image.addBands([ndvi, evi])


def compute_health_metrics(ndvi_mean: float) -> dict:
    """
    Derive crop health percentages from mean NDVI.

    Thresholds based on agricultural NDVI literature:
    - NDVI < 0.2: Bare soil / water
    - 0.2–0.4: Sparse vegetation / stress
    - 0.4–0.6: Moderate vegetation
    - 0.6–0.8: Healthy vegetation
    - > 0.8: Very dense vegetation
    """
    healthy = round(max(0, (ndvi_mean - 0.3) / 0.4 * 100), 1)
    stress = round(max(0, min(30, (0.3 - ndvi_mean) / 0.3 * 100)), 1)
    bare = max(0, round(100 - healthy - stress, 1))

    return {
        "healthy_pct": healthy,
        "stress_pct": stress,
        "bare_pct": bare,
    }


def run_ndvi_pipeline(request: Request) -> tuple[Any, int]:
    """
    Main Cloud Function entry point.

    POST /run_ndvi_pipeline
    Body: {
        "bounds": [[lat, lon], [lat, lon], ...],
        "date_from": "2024-01-01",
        "date_to": "2024-01-31",
        "indices": ["NDVI", "EVI", "LSWI"]  // optional
    }
    """
    # Set CORS headers for preflight
    if request.method == "OPTIONS":
        headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "3600",
        }
        return ("", 204, headers)

    # CORS headers for main request
    headers = {"Access-Control-Allow-Origin": "*"}

    try:
        body = request.get_json(silent=True) or {}

        # Validate
        valid, error_msg = validate_request(body)
        if not valid:
            return (jsonify({"error": error_msg}), 400, headers)

        # Extract parameters
        bounds = body["bounds"]
        date_from = body["date_from"]
        date_to = body["date_to"]
        requested_indices = body.get("indices", ["NDVI", "EVI"])

        # Create region geometry
        region = create_region(bounds)

        # Build Sentinel-2 collection
        s2 = (
            ee.ImageCollection(S2_COLLECTION)
            .filterDate(date_from, date_to)
            .filterBounds(region)
            .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", CLOUD_THRESHOLD))
            .median()
        )

        # Check if collection has images
        collection_size = (
            ee.ImageCollection(S2_COLLECTION)
            .filterDate(date_from, date_to)
            .filterBounds(region)
            .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", CLOUD_THRESHOLD))
            .size()
            .getInfo()
        )

        if collection_size == 0:
            return (
                jsonify({
                    "error": "No Sentinel-2 images found for the given date range and bounds",
                    "date_from": date_from,
                    "date_to": date_to,
                    "bounds": bounds,
                }),
                404,
                headers,
            )

        # Calculate indices
        indexed = calculate_indices(s2)

        # Compute statistics
        stats = indexed.select(["NDVI", "EVI"]).reduceRegion(
            reducer=ee.Reducer.mean().combine(
                ee.Reducer.percentile([10, 90]), None, True
            ),
            geometry=region,
            scale=SCALE_METERS,
            maxPixels=1e9,
        ).getInfo()

        # Extract values
        ndvi_mean = stats.get("NDVI_mean", 0)
        evi_mean = stats.get("EVI_mean", 0)
        ndvi_p10 = stats.get("NDVI_p10", 0)
        ndvi_p90 = stats.get("NDVI_p90", 0)

        # Calculate area in hectares
        area_ha = region.area().divide(10000).getInfo()

        # Compute health metrics
        health = compute_health_metrics(ndvi_mean)

        # Build response
        result = {
            "ndvi_mean": round(ndvi_mean, 3),
            "ndvi_p10": round(ndvi_p10, 3),
            "ndvi_p90": round(ndvi_p90, 3),
            "evi_mean": round(evi_mean, 3),
            "evi_p10": stats.get("EVI_p10", 0),
            "evi_p90": stats.get("EVI_p90", 0),
            "area_ha": round(area_ha, 2),
            "healthy_pct": health["healthy_pct"],
            "stress_pct": health["stress_pct"],
            "bare_pct": health["bare_pct"],
            "image_count": collection_size,
            "date_from": date_from,
            "date_to": date_to,
            "scale_meters": SCALE_METERS,
        }

        return (jsonify(result), 200, headers)

    except ee.EEException as e:
        return (
            jsonify({"error": "Earth Engine error", "details": str(e)}),
            500,
            headers,
        )
    except Exception as e:
        return (
            jsonify({"error": "Internal server error", "details": str(e)}),
            500,
            headers,
        )


# Cloud Functions entry point
@functions_framework.http
def main(request: Request):
    """Cloud Functions HTTP entry point."""
    response, status_code, headers = run_ndvi_pipeline(request)

    # If response is a tuple (from Flask jsonify), unpack it
    if isinstance(response, tuple):
        return response

    return response, status_code, headers


# Local development entry point
if __name__ == "__main__":
    from flask import Flask
    app = Flask(__name__)

    @app.route("/run_ndvi_pipeline", methods=["POST", "OPTIONS"])
    def local_endpoint():
        response, status_code, headers = run_ndvi_pipeline(Request.from_values())
        return response, status_code, headers

    print("🌿 GEE Pipeline running locally at http://localhost:8080")
    app.run(host="0.0.0.0", port=8080)
