#!/usr/bin/env python3
"""SXC-1 由来同定: 本体WAV と 購入WAV(Waves Place) を音で照合する。

データ構造の前提:
  本体:   {bank番号}_{bank名}/{pad番号}.wav  （例 01_MyBank/03.wav → Bank1 Pad3）
  購入:   {one_shot|loop}/{カテゴリ}/{機種}_{SR}_{音程}_{音色名}.wav
          （例 one_shot/keys/MT-40_48_C-3_Accordion.wav）

照合は2段階:
  ① 完全一致: PCMサンプルの内容ハッシュ（同一録音・同一フォーマットなら確定）
  ② スペクトログラム埋め込み: 位相を無視し時間長を固定化した対数マグニチュード・
     スペクトログラムのコサイン類似度。本体音が購入版と「同じ素材だが再レンダリング/
     テンポ違い/位相違い」でも検出できる（波形相関では取れない）。
一致した購入ファイル名から由来(機種)・音色名・音程を、親ディレクトリから
カテゴリ・loop/oneshot を取得。本体側はパスから bank/pad が確定する。

使い方:
    pip install librosa soundfile numpy
    python match.py --device ./device_wav --reference ./waves_place_wav --out matches.csv
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import re
import sys
from pathlib import Path

import numpy as np

try:
    import librosa
except ImportError:
    sys.exit("librosa が必要です: pip install librosa soundfile numpy")

try:
    import soundfile as sf
except ImportError:
    sf = None

ORIGIN_PATTERNS = [
    (re.compile(r"sk[\-_ ]?1", re.I), "SK-1"),
    (re.compile(r"sk[\-_ ]?5", re.I), "SK-5"),
    (re.compile(r"cz[\-_ ]?101", re.I), "CZ-101"),
    (re.compile(r"mt[\-_ ]?40", re.I), "MT-40"),
]
# 音名トークン。自然音 C-3 / シャープ F-sharp-3 / フラット A-flat-2 等に対応
NOTE_RE = re.compile(r"^[A-Ga-g](-sharp|-flat)?-\d+$")
AUDIO_EXT = {".wav", ".aif", ".aiff", ".flac"}


def detect_origin(text: str) -> str:
    for pat, name in ORIGIN_PATTERNS:
        if pat.search(text):
            return name
    return "unknown"


def audio_files(folder: Path) -> list[Path]:
    return sorted(p for p in folder.rglob("*") if p.suffix.lower() in AUDIO_EXT)


def embed(path: Path, sr: int, frames: int = 48, mel: int = 64, nfft: int = 2048, hop: int = 512):
    """1ファイル → 時間正規化した対数マグニチュード・スペクトログラム埋め込み（L2正規化）。
    位相を無視し時間長を固定化するため、再レンダリング・テンポ差・長さ違い・位相ズレに強い。"""
    try:
        y, _ = librosa.load(str(path), sr=sr, mono=True)
    except Exception as e:  # noqa: BLE001
        print(f"  ! 読み込み失敗: {path.name}: {e}", file=sys.stderr)
        return None
    y, _ = librosa.effects.trim(y, top_db=30)
    if y.size < nfft:
        y = np.pad(y, (0, nfft - y.size))
    peak = np.max(np.abs(y))
    if peak > 0:
        y = y / peak
    nfr = 1 + (y.size - nfft) // hop
    if nfr < 1:
        return None
    win = np.hanning(nfft)
    nbins = nfft // 2 + 1
    S = np.empty((nfr, nbins))
    for i in range(nfr):
        S[i] = np.abs(np.fft.rfft(y[i * hop : i * hop + nfft] * win))
    S = np.log1p(S)
    # 周波数を mel 本に圧縮（単純ビン平均）
    usable = (nbins // mel) * mel
    S = S[:, :usable].reshape(nfr, mel, -1).mean(axis=2)
    # 時間を frames 本に線形補間で固定長化（テンポ差・長さ違いを吸収）
    xs = np.arange(nfr)
    xi = np.linspace(0, nfr - 1, frames)
    T = np.stack([np.interp(xi, xs, S[:, m]) for m in range(mel)], axis=1)
    v = T.ravel()
    n = np.linalg.norm(v)
    return v / n if n > 0 else v


def content_key(path: Path):
    """PCMサンプル（int16・ネイティブSR）の内容ハッシュ。完全一致検出用。
    同一録音・同一フォーマットなら一致する（画像の完全重複検出と同じ考え方）。"""
    if sf is None:
        return None
    try:
        data, sr = sf.read(str(path), dtype="int16", always_2d=True)
    except Exception:  # noqa: BLE001
        return None
    return (sr, data.shape[1], hashlib.sha1(data.tobytes()).hexdigest())


def parse_device(path: Path, root: Path, bank_offset: int = 0):
    """本体パス → (bank, pad)。{NN}_name/{MM}.wav や bank00/01.wav を想定。
    bank_offset: 本体が 0 始まり(bank00=Bank1)の場合に 1 を指定。"""
    rel = path.relative_to(root)
    bank = None
    if len(rel.parts) >= 2:
        m = re.search(r"(\d+)", rel.parts[0])  # ディレクトリ名中の最初の数字
        bank = int(m.group(1)) + bank_offset if m else None
    pm = re.search(r"(\d+)", path.stem)
    pad = int(pm.group(1)) if pm else None
    return bank, pad


def parse_reference(path: Path, root: Path):
    """購入パス → 機種/音色名/音程/カテゴリ/種別 を抽出。
    例) one shot_tone/Brass Ensemble/SK-1_53_F-3_BrassEnsemble.wav
        loop/Rock/MT-40_36_C-2_Rock1.wav
    ファイル名は {機種}_{MIDI番号}_{音名}_{音色名} か {機種}_{ドラム名}。"""
    rel = path.relative_to(root)
    parts_lower = [p.lower() for p in rel.parts]
    is_loop = any("loop" in p for p in parts_lower)
    is_oneshot = any(
        ("one shot" in p) or ("one_shot" in p) or ("oneshot" in p) for p in parts_lower
    )
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


def build(folder: Path, sr: int, frames: int, mel: int):
    items, vecs = [], []
    for p in audio_files(folder):
        v = embed(p, sr, frames, mel)
        if v is not None:
            items.append(p)
            vecs.append(v)
    mat = np.vstack(vecs) if vecs else np.zeros((0, frames * mel))
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
    ap.add_argument("--coverage", type=Path, default=None,
                    help="購入音源の有り/無しカバレッジCSVを出力するパス")
    ap.add_argument("--sr", type=int, default=22050, help="解析サンプルレート")
    ap.add_argument("--frames", type=int, default=48, help="スペクトログラムの時間正規化フレーム数")
    ap.add_argument("--mel", type=int, default=64, help="周波数圧縮の本数")
    ap.add_argument("--threshold", type=float, default=0.85,
                    help="confident とみなすスペクトログラム類似度")
    ap.add_argument("--dup-threshold", type=float, default=0.97)
    ap.add_argument("--bank-offset", type=int, default=0,
                    help="本体が0始まり(bank00=Bank1)なら 1 を指定")
    ap.add_argument("--no-exact", action="store_true",
                    help="PCM内容ハッシュによる完全一致照合を行わない")
    args = ap.parse_args()

    print(f"購入WAV を読み込み中: {args.reference}")
    ref_paths, ref_mat = build(args.reference, args.sr, args.frames, args.mel)
    print(f"  {len(ref_paths)} 件")
    print(f"本体WAV を読み込み中: {args.device}")
    dev_paths, dev_mat = build(args.device, args.sr, args.frames, args.mel)
    print(f"  {len(dev_paths)} 件")
    if not len(ref_paths) or not len(dev_paths):
        sys.exit("WAV が見つかりません。フォルダを確認してください。")

    ref_meta = [parse_reference(p, args.reference) for p in ref_paths]
    sim = dev_mat @ ref_mat.T  # スペクトログラム埋め込みのコサイン類似度
    dup = duplicate_groups(dev_mat, args.dup_threshold)

    ndev = len(dev_paths)
    best = np.full(ndev, -1, dtype=int)
    best_sim = np.zeros(ndev)
    method = [""] * ndev
    todo = list(range(ndev))  # まだ確定していない本体インデックス

    # ① 完全一致（PCM内容ハッシュ）— 同一録音なら即確定
    if not args.no_exact and sf is not None:
        print("完全一致を照合中（PCM内容ハッシュ）…")
        ref_keys = {}
        for j, p in enumerate(ref_paths):
            k = content_key(p)
            if k is not None:
                ref_keys.setdefault(k, j)
        remaining = []
        for i in todo:
            k = content_key(dev_paths[i])
            j = ref_keys.get(k) if k is not None else None
            if j is not None:
                best[i], best_sim[i], method[i] = j, 1.0, "exact"
            else:
                remaining.append(i)
        todo = remaining
        print(f"  完全一致: {ndev - len(todo)} / {ndev}")

    # ② 残りを照合: スペクトログラム埋め込みのコサイン類似度で最良を選ぶ
    #    （位相を無視し時間長を固定化するため、再レンダリング/テンポ差にも対応）
    for i in todo:
        best[i] = int(sim[i].argmax())
        best_sim[i] = float(sim[i].max())
        method[i] = "spec"

    rows = []
    for i, p in enumerate(dev_paths):
        bank, pad = parse_device(p, args.device, args.bank_offset)
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
            "method": method[i],
            "confident": bool(method[i] == "exact" or best_sim[i] >= args.threshold),
            "dup_group": dup[i],
        })
    rows.sort(key=lambda r: (r["bank"] or 999, r["pad"] or 999))

    with args.out.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)

    confident = sum(r["confident"] for r in rows)
    n_groups = len(set(dup))
    n_exact = sum(1 for r in rows if r["method"] == "exact")
    n_spec = sum(1 for r in rows if r["method"] == "spec")
    print(f"\n完了: {args.out}")
    print(f"  完全一致(exact): {n_exact} / スペクトログラム(spec): {n_spec}")
    print(f"  自動確定(confident): {confident}/{len(rows)}")
    print(f"  本体内の重複クラスタ数: {n_groups}（{len(dev_paths)} 音 → {n_groups} 種の可能性）")

    # --- カバレッジ（購入音源の有り/無し）---
    if args.coverage:
        dev_slots = []
        for p in dev_paths:
            b, pad = parse_device(p, args.device, args.bank_offset)
            dev_slots.append(f"b{b}-p{pad}" if b and pad else p.name)
        ref_best = sim.max(axis=0)      # 各購入ファイルに最も近い本体類似度
        ref_best_dev = sim.argmax(axis=0)

        groups = {}
        for j in range(len(ref_paths)):
            m = ref_meta[j]
            key = (m["origin"], m["type"], m["category"])
            g = groups.setdefault(key, {"files": 0, "best": 0.0, "slots": set()})
            g["files"] += 1
            if ref_best[j] > g["best"]:
                g["best"] = float(ref_best[j])
            if ref_best[j] >= args.threshold:
                g["slots"].add(dev_slots[ref_best_dev[j]])

        cov_rows = []
        for (origin, type_, category), g in groups.items():
            cov_rows.append({
                "origin": origin,
                "type": type_,
                "category": category,
                "ref_files": g["files"],
                "present": bool(g["best"] >= args.threshold),
                "best_similarity": round(g["best"], 4),
                "device_slots": " ".join(sorted(g["slots"])),
            })
        cov_rows.sort(key=lambda r: (r["origin"], r["type"], r["category"]))
        with args.coverage.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=list(cov_rows[0].keys()))
            w.writeheader()
            w.writerows(cov_rows)
        present = sum(r["present"] for r in cov_rows)
        print(f"\nカバレッジ: {args.coverage}")
        print(f"  有り {present} / 全 {len(cov_rows)} 音色グループ（無し {len(cov_rows) - present}）")


if __name__ == "__main__":
    main()
