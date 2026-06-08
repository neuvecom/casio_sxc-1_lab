#!/usr/bin/env python3
"""SXC-1 由来同定: 本体WAV と 購入WAV(Waves Place) を音で照合する。

データ構造の前提:
  本体:   {bank番号}_{bank名}/{pad番号}.wav  （例 01_MyBank/03.wav → Bank1 Pad3）
  購入:   {one_shot|loop}/{カテゴリ}/{機種}_{SR}_{音程}_{音色名}.wav
          （例 one_shot/keys/MT-40_48_C-3_Accordion.wav）

本体WAV を購入WAV に音響特徴で突き合わせ、一致した購入ファイル名から
由来(機種)・音色名・音程を、親ディレクトリから カテゴリ・loop/oneshot を取得する。
本体側はパスから bank/pad が確定するので、結果は該当スロットに直接対応づく。

使い方:
    pip install librosa soundfile numpy
    python match.py --device ./device_wav --reference ./waves_place_wav --out matches.csv
"""
import argparse
import csv
import re
import sys
from pathlib import Path

import numpy as np

try:
    import librosa
except ImportError:
    sys.exit("librosa が必要です: pip install librosa soundfile numpy")

ORIGIN_PATTERNS = [
    (re.compile(r"sk[\-_ ]?1", re.I), "SK-1"),
    (re.compile(r"sk[\-_ ]?5", re.I), "SK-5"),
    (re.compile(r"cz[\-_ ]?101", re.I), "CZ-101"),
    (re.compile(r"mt[\-_ ]?40", re.I), "MT-40"),
]
NOTE_RE = re.compile(r"^[A-Ga-g][#b]?-?\d+$")  # 例: C-3, F#2, Ab-1
AUDIO_EXT = {".wav", ".aif", ".aiff", ".flac"}


def detect_origin(text: str) -> str:
    for pat, name in ORIGIN_PATTERNS:
        if pat.search(text):
            return name
    return "unknown"


def audio_files(folder: Path) -> list[Path]:
    return sorted(p for p in folder.rglob("*") if p.suffix.lower() in AUDIO_EXT)


def embed(path: Path, sr: int, n_mfcc: int):
    """1ファイル → MFCC の平均/標準偏差を結合した固定長ベクトル（L2正規化）。"""
    try:
        y, _ = librosa.load(str(path), sr=sr, mono=True)
    except Exception as e:  # noqa: BLE001
        print(f"  ! 読み込み失敗: {path.name}: {e}", file=sys.stderr)
        return None
    y, _ = librosa.effects.trim(y, top_db=30)
    if y.size < sr // 50:
        return None
    peak = np.max(np.abs(y))
    if peak > 0:
        y = y / peak
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)
    vec = np.concatenate([mfcc.mean(axis=1), mfcc.std(axis=1)])
    norm = np.linalg.norm(vec)
    return vec / norm if norm > 0 else vec


def parse_device(path: Path, root: Path):
    """本体パス → (bank, pad)。{NN}_name/{MM}.wav を想定。"""
    rel = path.relative_to(root)
    bank = None
    if len(rel.parts) >= 2:
        m = re.match(r"^(\d+)", rel.parts[0])
        bank = int(m.group(1)) if m else None
    pm = re.match(r"^(\d+)", path.stem)
    pad = int(pm.group(1)) if pm else None
    return bank, pad


def parse_reference(path: Path, root: Path):
    """購入パス → 機種/音色名/音程/カテゴリ/種別 を抽出。"""
    rel = path.relative_to(root)
    parts_lower = [p.lower() for p in rel.parts]
    is_loop = any("loop" in p for p in parts_lower)
    is_oneshot = any("one_shot" in p or "oneshot" in p for p in parts_lower)
    category = rel.parts[-2] if len(rel.parts) >= 2 else ""

    tokens = path.stem.split("_")
    origin = detect_origin(tokens[0]) if tokens else "unknown"
    if origin == "unknown":
        origin = detect_origin(path.stem)
    # 音程トークンの位置を探し、その後ろを音色名とする
    note, name = "", path.stem
    note_idx = next((i for i, t in enumerate(tokens) if NOTE_RE.match(t)), None)
    if note_idx is not None:
        note = tokens[note_idx]
        rest = tokens[note_idx + 1:]
        if rest:
            name = "_".join(rest)
    elif len(tokens) >= 2:
        name = tokens[-1]
    return {
        "origin": origin,
        "name": name,
        "note": note,
        "category": category,
        "type": "loop" if is_loop else ("one_shot" if is_oneshot else ""),
    }


def build(folder: Path, sr: int, n_mfcc: int):
    items, vecs = [], []
    for p in audio_files(folder):
        v = embed(p, sr, n_mfcc)
        if v is not None:
            items.append(p)
            vecs.append(v)
    mat = np.vstack(vecs) if vecs else np.zeros((0, n_mfcc * 2))
    return items, mat


def duplicate_groups(mat: np.ndarray, dup_th: float) -> list[int]:
    n = mat.shape[0]
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    if n:
        sim = mat @ mat.T
        for i in range(n):
            for j in range(i + 1, n):
                if sim[i, j] >= dup_th:
                    parent[find(i)] = find(j)
    return [find(i) for i in range(n)]


def main() -> None:
    ap = argparse.ArgumentParser(description="SXC-1 本体WAV と 購入WAV を照合して由来を同定")
    ap.add_argument("--device", required=True, type=Path)
    ap.add_argument("--reference", required=True, type=Path)
    ap.add_argument("--out", type=Path, default=Path("matches.csv"))
    ap.add_argument("--sr", type=int, default=22050)
    ap.add_argument("--n-mfcc", type=int, default=20)
    ap.add_argument("--threshold", type=float, default=0.92)
    ap.add_argument("--dup-threshold", type=float, default=0.985)
    args = ap.parse_args()

    print(f"購入WAV を読み込み中: {args.reference}")
    ref_paths, ref_mat = build(args.reference, args.sr, args.n_mfcc)
    print(f"  {len(ref_paths)} 件")
    print(f"本体WAV を読み込み中: {args.device}")
    dev_paths, dev_mat = build(args.device, args.sr, args.n_mfcc)
    print(f"  {len(dev_paths)} 件")
    if not len(ref_paths) or not len(dev_paths):
        sys.exit("WAV が見つかりません。フォルダを確認してください。")

    ref_meta = [parse_reference(p, args.reference) for p in ref_paths]
    sim = dev_mat @ ref_mat.T
    best = sim.argmax(axis=1)
    best_sim = sim.max(axis=1)
    dup = duplicate_groups(dev_mat, args.dup_threshold)

    rows = []
    for i, p in enumerate(dev_paths):
        bank, pad = parse_device(p, args.device)
        m = ref_meta[best[i]]
        rows.append({
            "bank": bank,
            "pad": pad,
            "slot_id": f"b{bank}-p{pad}" if bank and pad else "",
            "device_file": str(p.relative_to(args.device)),
            "best_reference": str(ref_paths[best[i]].relative_to(args.reference)),
            "origin": m["origin"],
            "sound_name": m["name"],
            "note": m["note"],
            "category": m["category"],
            "type": m["type"],
            "similarity": round(float(best_sim[i]), 4),
            "confident": bool(best_sim[i] >= args.threshold),
            "dup_group": dup[i],
        })
    rows.sort(key=lambda r: (r["bank"] or 999, r["pad"] or 999))

    with args.out.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)

    confident = sum(r["confident"] for r in rows)
    n_groups = len(set(dup))
    print(f"\n完了: {args.out}")
    print(f"  自動確定(confident): {confident}/{len(rows)}")
    print(f"  本体内の重複クラスタ数: {n_groups}（{len(dev_paths)} 音 → {n_groups} 種の可能性）")


if __name__ == "__main__":
    main()
