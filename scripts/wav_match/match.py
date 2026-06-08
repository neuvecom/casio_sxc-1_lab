#!/usr/bin/env python3
"""SXC-1 由来同定: 本体WAV と 購入WAV(Waves Place) を音で照合する。

購入データはファイル名に機種名（SK-1 / MT40 等）が含まれるため、
本体WAV を購入WAV に音響特徴で突き合わせれば、最も近い購入ファイルの
機種ラベル＝由来として割り当てられる。本体内の重複（同じ音が複数パッド）も検出する。

使い方:
    pip install librosa soundfile numpy
    python match.py --device ./device_wav --reference ./waves_place_wav --out matches.csv

出力 matches.csv の列:
    device_file       本体WAVのファイル名
    best_reference    最も近い購入WAVのファイル名
    origin            購入WAVファイル名から推定した機種（SK-1/SK-5/CZ-101/MT-40/unknown）
    similarity        類似度(0〜1, コサイン)。高いほど一致
    confident         しきい値以上なら True（自動確定の目安）
    dup_group         本体内の重複クラスタID（同IDは同一音の可能性）

注意:
    - 完全自動で100%にはならない。confident=False は耳で要確認。
    - 購入データは個人利用の範囲で照合に使用（音源そのものは再配布しない）。
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

# 購入WAVのファイル名から機種を判定するパターン（上から順に評価）
ORIGIN_PATTERNS = [
    (re.compile(r"sk[\-_ ]?1", re.I), "SK-1"),
    (re.compile(r"sk[\-_ ]?5", re.I), "SK-5"),
    (re.compile(r"cz[\-_ ]?101", re.I), "CZ-101"),
    (re.compile(r"mt[\-_ ]?40", re.I), "MT-40"),
]

WAV_GLOB = ("*.wav", "*.WAV", "*.aif", "*.aiff", "*.flac")


def detect_origin(filename: str) -> str:
    for pat, name in ORIGIN_PATTERNS:
        if pat.search(filename):
            return name
    return "unknown"


def list_audio(folder: Path) -> list[Path]:
    files: list[Path] = []
    for g in WAV_GLOB:
        files.extend(folder.glob(g))
    return sorted(set(files))


def embed(path: Path, sr: int, n_mfcc: int) -> np.ndarray | None:
    """1ファイル → 固定長の音響特徴ベクトル（MFCC の平均・標準偏差）。"""
    try:
        y, _ = librosa.load(str(path), sr=sr, mono=True)
    except Exception as e:  # noqa: BLE001
        print(f"  ! 読み込み失敗: {path.name}: {e}", file=sys.stderr)
        return None
    y, _ = librosa.effects.trim(y, top_db=30)  # 前後の無音を除去
    if y.size < sr // 50:  # 短すぎ（~20ms未満）はスキップ
        return None
    peak = np.max(np.abs(y))
    if peak > 0:
        y = y / peak  # ピーク正規化
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)
    vec = np.concatenate([mfcc.mean(axis=1), mfcc.std(axis=1)])
    norm = np.linalg.norm(vec)
    return vec / norm if norm > 0 else vec


def load_embeddings(folder: Path, sr: int, n_mfcc: int):
    names, vecs = [], []
    for p in list_audio(folder):
        v = embed(p, sr, n_mfcc)
        if v is not None:
            names.append(p.name)
            vecs.append(v)
    if not vecs:
        return names, np.zeros((0, n_mfcc * 2))
    return names, np.vstack(vecs)


def duplicate_groups(mat: np.ndarray, dup_th: float) -> list[int]:
    """本体埋め込み行列内で類似度>=dup_th を同一クラスタにまとめる(union-find)。"""
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
    ap.add_argument("--device", required=True, type=Path, help="本体からDLしたWAVのフォルダ")
    ap.add_argument("--reference", required=True, type=Path, help="購入WAV(Waves Place)のフォルダ")
    ap.add_argument("--out", type=Path, default=Path("matches.csv"))
    ap.add_argument("--sr", type=int, default=22050, help="解析サンプルレート")
    ap.add_argument("--n-mfcc", type=int, default=20)
    ap.add_argument("--threshold", type=float, default=0.92, help="confident とみなす類似度")
    ap.add_argument("--dup-threshold", type=float, default=0.985, help="本体内 重複とみなす類似度")
    args = ap.parse_args()

    print(f"購入WAV を読み込み中: {args.reference}")
    ref_names, ref_mat = load_embeddings(args.reference, args.sr, args.n_mfcc)
    print(f"  {len(ref_names)} 件")
    print(f"本体WAV を読み込み中: {args.device}")
    dev_names, dev_mat = load_embeddings(args.device, args.sr, args.n_mfcc)
    print(f"  {len(dev_names)} 件")

    if len(ref_names) == 0 or len(dev_names) == 0:
        sys.exit("WAV が見つかりません。フォルダを確認してください。")

    sim = dev_mat @ ref_mat.T  # (device x reference) コサイン類似度
    best_idx = sim.argmax(axis=1)
    best_sim = sim.max(axis=1)
    dup = duplicate_groups(dev_mat, args.dup_threshold)

    rows = []
    for i, name in enumerate(dev_names):
        ref = ref_names[best_idx[i]]
        rows.append({
            "device_file": name,
            "best_reference": ref,
            "origin": detect_origin(ref),
            "similarity": round(float(best_sim[i]), 4),
            "confident": bool(best_sim[i] >= args.threshold),
            "dup_group": dup[i],
        })
    rows.sort(key=lambda r: r["similarity"], reverse=True)

    with args.out.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)

    confident = sum(r["confident"] for r in rows)
    n_groups = len(set(dup))
    print(f"\n完了: {args.out}")
    print(f"  自動確定(confident): {confident}/{len(rows)}")
    print(f"  本体内の重複クラスタ数: {n_groups}（{len(dev_names)} 音 → {n_groups} 種の可能性）")


if __name__ == "__main__":
    main()
