"""Bake aligned 8-bit relief maps for a painting, given relative depth or a DPT model."""

import argparse
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


def blur(values, sigma):
    return cv2.GaussianBlur(values, (0, 0), max(0.12, sigma))


def read_scalar(path, size):
    with Image.open(path) as source:
        w, h = source.size
        if abs(w / h / (size[0] / size[1]) - 1) > 0.015:
            raise ValueError(
                f"{path.name} must use the same uncropped aspect ratio as the painting"
            )
        if source.mode in ("I", "I;16", "I;16B", "I;16L"):
            values = np.asarray(source, dtype=np.float32) / 65535
        else:
            values = np.asarray(source.convert("L"), dtype=np.float32) / 255
    return np.clip(cv2.resize(values, size, interpolation=cv2.INTER_LINEAR), 0, 1)


def infer_depth(painting, model):
    import onnxruntime as ort

    w, h = painting.size
    pw, ph = max(w, round(h / 1.6)), max(h, round(w / 1.6))
    backdrop = Image.new("RGB", (pw, ph), (225, 212, 187))
    left, top = (pw - w) // 2, (ph - h) // 2
    backdrop.paste(painting, (left, top), painting.getchannel("A"))
    scale = 518 / min(pw, ph)
    size = tuple(max(14, round(n * scale / 14) * 14) for n in (pw, ph))
    rgb = (
        np.asarray(backdrop.resize(size, Image.Resampling.BICUBIC), dtype=np.float32)
        / 255
    )
    pixels = (rgb - np.float32([0.485, 0.456, 0.406])) / np.float32(
        [0.229, 0.224, 0.225]
    )
    options = ort.SessionOptions()
    options.intra_op_num_threads = 4
    session = ort.InferenceSession(
        str(model), sess_options=options, providers=["CPUExecutionProvider"]
    )
    pred = session.run(
        None,
        {
            session.get_inputs()[0].name: np.ascontiguousarray(
                pixels.transpose(2, 0, 1)[None]
            )
        },
    )[0].squeeze()
    pred = cv2.resize(pred, (pw, ph), interpolation=cv2.INTER_CUBIC)[
        top : top + h, left : left + w
    ]
    far, near = np.percentile(
        pred[np.asarray(painting.getchannel("A")) > 100], [1.5, 98.5]
    )
    return np.clip((pred - far) / max(0.001, near - far), 0, 1)


def bake(args):
    with Image.open(args.paint) as source:
        painting = source.convert("RGBA")
    painting.thumbnail((args.size, args.size), Image.Resampling.LANCZOS)
    if min(painting.size) < 2:
        raise ValueError("Surface gradients require at least two pixels on both axes")
    pixels = np.float32(painting) / 255
    red, green, blue, alpha = pixels.transpose(2, 0, 1)
    if not np.any(alpha > 0.5):
        raise ValueError("The painting has no solid subject pixels")
    scene = (
        read_scalar(args.depth, painting.size)
        if args.depth
        else infer_depth(painting, args.model)
    )
    opaque = (alpha > 0.5).astype(np.uint8)
    unit = min(painting.size) / 350
    lum = 0.25 * red + 0.58 * green + 0.17 * blue

    def smooth_luma(sigma):
        return blur(lum * alpha, sigma) / np.maximum(0.001, blur(alpha, sigma))

    body, fine = smooth_luma(8), smooth_luma(0.85)
    distance = cv2.distanceTransform(opaque, cv2.DIST_L2, 5)
    rounded = np.sqrt(np.clip(distance / (26 * unit), 0, 1))
    depth = 0.87 * scene + 0.13 * rounded
    height = 0.72 * blur(scene, 2.2 * unit) + 0.28 * rounded
    height += 0.13 * (smooth_luma(1.8 * unit) - smooth_luma(9 * unit)) + 0.025 * (
        fine - body
    )
    if args.material == "metal":
        seams = np.uint8((alpha > 0.5) & (smooth_luma(1.4 * unit) > 0.11))
        rib = cv2.distanceTransform(seams, cv2.DIST_L2, 5)
        height += 0.20 * np.sqrt(np.clip(rib / (13 * unit), 0, 1))
    dy, dx = np.gradient(height)
    slope = unit * (22 if args.material == "metal" else 15)
    normal = np.stack((-slope * dx, slope * dy, np.ones_like(dx)), axis=-1)
    normal /= np.linalg.norm(normal, axis=-1, keepdims=True)
    normal[alpha < 0.02] = [0, 0, 1]
    if args.roughness:
        rough = read_scalar(args.roughness, painting.size)
    else:
        base = (
            0.43 - 0.27 * fine + 0.09 * np.abs(lum - body)
            if args.material == "metal"
            else 0.86 - 0.15 * fine
        )
        rough = np.clip(base + 0.075 * (body - fine), 0.08, 0.98)
    args.out.mkdir(parents=True, exist_ok=True)
    for name, values in [
        ("normal", normal * 0.5 + 0.5),
        ("depth", np.where(opaque, depth, 0)),
        ("roughness", np.where(opaque, rough, 1)),
    ]:
        output = args.out / (args.paint.stem + "-" + name + ".webp")
        Image.fromarray(np.uint8(np.round(255 * np.clip(values, 0, 1)))).save(
            output, lossless=True, method=4
        )
        print(output)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paint", type=Path)
    depth = parser.add_mutually_exclusive_group(required=True)
    depth.add_argument(
        "--depth", type=Path, help="Aligned white-near grayscale depth, 8 or 16 bits"
    )
    depth.add_argument(
        "--model",
        type=Path,
        help="Local Depth Anything V2 Small ONNX with dynamic spatial dimensions",
    )
    parser.add_argument(
        "--roughness",
        type=Path,
        help="Optional aligned grayscale roughness mask, white is matte",
    )
    parser.add_argument("--material", choices=["metal", "matte"], default="metal")
    parser.add_argument(
        "--size", type=int, default=1400, help="Maximum output dimension"
    )
    parser.add_argument("--out", type=Path, required=True)
    params = parser.parse_args()
    if params.size < 8:
        parser.error("--size must be at least 8 pixels")
    bake(params)
