# EXAMPLE ONLY (Greymourn thread A5, 19 Nov 2026): the start-still composite for the knight in the courtyard.
# Paths are relative to ~/Library/Caches/gm-tutorial/a5/. Read it for the method (plate, costume scaled by
# face widths, his head from the drive's first frame at the drive's framing, pre-relight, rim), then write your own for a new
# world and costume. twin-0203-mask.png is a person matte of the twin frame (Vision person segmentation).
# A5 start-frame composite (1920x1080): plate P2 reframed so the fog gate sits camera-right of his head (and dimmed),
# the game knight's armour scaled so the pauldrons span ~4.3 face widths (A4: 3.06; his bare shoulders 3.6; game knight 4.5),
# his head + right hand from twin frame 203 (film 26.86 s, eyes on the lens) at the drive's first framing (scale 0.80,
# eyes at 0.44 W, 0.40 H), pre-relit: -0.5 stop, warm key falling off from camera left, a cool rim on his right edge.
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
W, H = 1920, 1080
S0, EX, EY = 0.80, 0.44 * W, 0.40 * H
TE = (1030.4, 429.3)                      # eye midpoint in twin frame 203 (Vision)
ox, oy = EX - S0 * TE[0], EY - S0 * TE[1]
CW = 389.0 * S0                            # face contour width in the comp
FL, FR = ox + S0 * 826, ox + S0 * 1215     # face contour x range
CHIN = oy + S0 * 753.2
# plate: P2 4K, crop 0.72 from x0 0, y0 180, then dim the gate
P = Image.open('../a4/cam/P2-stair-gate-wide.jpg').convert('RGB')
cw_, ch_ = int(3840 * 0.72), int(2160 * 0.72)
plate = np.asarray(P.crop((0, 180, cw_, 180 + ch_)).resize((W, H), Image.LANCZOS), np.float32)
yy, xx = np.mgrid[0:H, 0:W]
gate = np.exp(-(((xx - 0.86 * W) / (0.30 * W)) ** 2 + ((yy - 0.23 * H) / (0.16 * H)) ** 2))
plate *= (1 - 0.5 * gate)[..., None] * np.array([0.92, 0.97, 1.05]) * 0.82
# armour from the game knight reference (900x1296), hand-drawn silhouette, helmet removed
A = Image.open('../a4/cam/knight-armour-ref.jpg').convert('RGB')
poly = [(95, 1296), (105, 760), (125, 590), (175, 540), (238, 505), (285, 540), (318, 582), (562, 582), (585, 548),
        (640, 518), (690, 570), (760, 640), (815, 720), (850, 860), (880, 1296)]
am = Image.new('L', A.size, 0); ImageDraw.Draw(am).polygon(poly, fill=255); am = am.filter(ImageFilter.GaussianBlur(3))
SPAN_REF = 680.0; k = 4.3 * CW / SPAN_REF
gx, gy = 430, 590                          # gorget top centre in the reference
NECK_X, NECK_Y = (FL + FR) / 2, CHIN + 42
ax, ay = NECK_X - k * gx, NECK_Y - k * gy
As = A.resize((round(A.width * k), round(A.height * k)), Image.LANCZOS); ams = am.resize(As.size, Image.LANCZOS)
arm = Image.new('RGB', (W, H)); armm = Image.new('L', (W, H), 0)
arm.paste(As, (round(ax), round(ay))); armm.paste(ams, (round(ax), round(ay)))
arm = np.asarray(arm, np.float32); armm = np.asarray(armm, np.float32)[..., None] / 255
t = np.clip((xx - (NECK_X - 0.35 * W)) / (0.7 * W), 0, 1)[..., None]
arm *= (1 - t) * np.array([0.78, 0.60, 0.42]) + t * np.array([0.30, 0.34, 0.42])
out = plate * (1 - armm) + arm * armm
# head + hand from the twin frame
T = Image.open('comp/twin-0203.jpg').convert('RGB'); M = Image.open('comp/twin-0203-mask.png').convert('L')
Ts = np.asarray(T.resize((round(1920 * S0), round(1080 * S0)), Image.LANCZOS), np.float32)
Ms = np.asarray(M.resize((round(1920 * S0), round(1080 * S0)), Image.LANCZOS), np.float32) / 255
hy, hx = np.mgrid[0:Ms.shape[0], 0:Ms.shape[1]]
tw_y = hy / S0; tw_x = hx / S0                     # back in twin pixels
NCX = (826 + 1215) / 2                             # neck centre x in the twin
halfw = np.interp(tw_y, [600, 690, 760, 800], [215, 205, 140, 118])      # head, jaw, neck half-widths in twin px
head = np.maximum((tw_y < 600) * 1.0, np.clip((halfw - abs(tw_x - NCX)) / 12, 0, 1)) * np.clip((815 - tw_y) / 20, 0, 1)
neck = 0 * head
skin = (Ts[..., 0] > 110) & (Ts[..., 0] > Ts[..., 2] + 30) & (Ts[..., 0] > Ts[..., 1] + 8)
hand = ((tw_x > 1345) & (tw_y > 845) & skin) * 1.0   # his right hand: skin pixels only in the bottom-right corner
hand = np.asarray(Image.fromarray((hand * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(2)), np.float32) / 255
keep = np.maximum(np.maximum(head, neck), hand)
Ms = Ms * keep
layer = np.zeros((H, W, 3), np.float32); lm = np.zeros((H, W), np.float32)
x0, y0 = round(ox), round(oy)
sx0, sy0 = max(0, -x0), max(0, -y0); dx0, dy0 = max(0, x0), max(0, y0)
w_ = min(Ts.shape[1] - sx0, W - dx0); h_ = min(Ts.shape[0] - sy0, H - dy0)
layer[dy0:dy0 + h_, dx0:dx0 + w_] = Ts[sy0:sy0 + h_, sx0:sx0 + w_]; lm[dy0:dy0 + h_, dx0:dx0 + w_] = Ms[sy0:sy0 + h_, sx0:sx0 + w_]
# relight: warm key from camera left falling off ~1 stop across the face, cooler and darker on the far side
tf = np.clip((xx - FL) / (FR - FL), 0, 1)[..., None]
layer *= 0.82 * ((1 - tf) * np.array([1.08, 0.93, 0.72]) + tf * np.array([0.52, 0.56, 0.68]))
# cool rim on his right (camera-right) silhouette edge, from the gate
mI = Image.fromarray((lm * 255).astype(np.uint8))
er = np.asarray(mI.filter(ImageFilter.MinFilter(9)), np.float32) / 255
edge = np.clip(lm - er, 0, 1) * np.clip((xx - (FL + 0.62 * (FR - FL))) / (0.25 * CW), 0, 1) * (yy < CHIN + 10)
edge = np.asarray(Image.fromarray((edge * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2)), np.float32) / 255
layer += edge[..., None] * np.array([70, 92, 125])
out = out * (1 - lm[..., None]) + layer * lm[..., None]
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save('comp/comp-1080.png')
print('face cw', round(CW), 'face x', round(FL), round(FR), 'chin', round(CHIN), 'armour scale', round(k, 3), 'span px', round(SPAN_REF * k))
