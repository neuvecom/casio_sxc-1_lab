# WAV 照合ツール（由来同定）

本体（SXC-1）からダウンロードした WAV と、Waves Place で購入した実機 WAV を
音響特徴で突き合わせ、**由来を同定**するローカルツール。
購入WAV はファイル名に機種名（SK-1 / MT40 等）を含むため、一致した購入ファイルの
ラベルがそのまま由来になる。本体内の**重複配置**も検出する。

> 構想は `docs-dev/idea/wav_matching.md` を参照。

## セットアップ

```bash
pip install librosa soundfile numpy
```

## 使い方

```bash
python scripts/wav_match/match.py \
  --device ./device_wav \          # 本体からDLしたWAVのフォルダ
  --reference ./waves_place_wav \  # 購入WAV(Waves Place)のフォルダ
  --out matches.csv
```

### 主なオプション

| オプション | 既定 | 説明 |
| --- | --- | --- |
| `--threshold` | 0.92 | これ以上の類似度を `confident=True`（自動確定の目安）に |
| `--dup-threshold` | 0.985 | 本体WAV同士がこれ以上似ていたら同一音（重複）とみなす |
| `--sr` | 22050 | 解析サンプルレート |
| `--n-mfcc` | 20 | MFCC 次数 |

## データ構造の前提

```
本体:  {bank番号}_{bank名}/{pad番号}.wav     例) 01_MyBank/03.wav → Bank1 Pad3
購入:  {one_shot|loop}/{カテゴリ}/{機種}_{SR}_{音程}_{音色名}.wav
       例) one_shot/keys/MT-40_48_C-3_Accordion.wav
```

- 本体はパスから **bank/pad が確定** → 結果は該当スロットに直接対応づく。
- 購入はファイル名から **機種・音程・音色名**、親ディレクトリから **カテゴリ・loop/oneshot** を抽出。

## 出力 `matches.csv`

| 列 | 内容 |
| --- | --- |
| `bank` / `pad` / `slot_id` | 本体パスから抽出したバンク・パッド（`b1-p3` 形式） |
| `device_file` | 本体WAV（相対パス） |
| `best_reference` | 最も近い購入WAV（相対パス） |
| `origin` | 機種（SK-1/SK-5/CZ-101/MT-40/unknown） |
| `sound_name` | 購入ファイル名の音色名（例 Accordion） |
| `note` | 音程（例 C-3） |
| `category` | 購入の親カテゴリ |
| `type` | one_shot / loop |
| `similarity` | 類似度(0〜1)。高いほど一致 |
| `confident` | しきい値以上なら True（自動確定の目安） |
| `dup_group` | 本体内の重複クラスタID（同IDは同一音の可能性） |

行は bank → pad 順に並ぶので、そのままスロット単位で確認・取り込みしやすい。

## 運用の流れ（想定）

1. 本体WAV と 購入WAV をフォルダに用意して実行
2. `confident=True` は由来を**自動確定**として採用
3. `confident=False` は耳で確認（しきい値は調整可）
4. `dup_group` が同じものは重複配置 → DB では1音にまとめる/相互参照
5. 確定した由来は、将来的に管理者ページの一括取り込みへ連携予定

## 仕組み・調整

- 各WAVを「無音トリム → ピーク正規化 → MFCC の平均/標準偏差(40次元)」で固定長ベクトル化し、
  コサイン類似度で最近傍を探索。同一録音なら高スコアで一致する。
- 取りこぼし／誤マッチが多い場合は `--threshold` を調整。
- より厳密にしたい場合は、候補のみ波形の相互相関で再スコアリングする拡張も可能（要望があれば追加）。

## 注意

- 購入データは**個人利用の範囲**で照合に使う。音源そのものは再配布しない（`.gitignore` 推奨）。
- 完全自動で100%にはならない前提（自動確定／要確認の二段構え）。
