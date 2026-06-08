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
| `--threshold` | 0.9 | `confident=True`（自動確定）とみなす類似度。精緻化時は波形相関の値 |
| `--no-refine` | （無し） | 波形相関での精緻化をやめ MFCC のみで照合（高速・低精度） |
| `--topk` | 20 | MFCCで絞る候補数（この中から波形相関で最良を選ぶ） |
| `--refine-sr` | 8000 | 波形相関に使うサンプルレート |
| `--refine-seconds` | 5.0 | 波形相関で比較する先頭秒数 |
| `--dup-threshold` | 0.985 | 本体WAV同士がこれ以上似ていたら同一音（重複）とみなす |
| `--bank-offset` | 0 | 本体が0始まり(bank00=Bank1)なら 1 を指定 |
| `--coverage` | （無し） | 購入音源の有り/無しカバレッジCSVを出力するパス |

## カバレッジ（購入音源の有り/無し）

`--coverage` を付けると、購入音源側を **音色グループ（機種×種別×カテゴリ）** 単位で集計し、
本体プリセットに入っているか（有り/無し）を出力する。

```bash
python scripts/wav_match/match.py \
  --device scripts/wav_match/device_wav \
  --reference scripts/wav_match/waves_place_wav \
  --out scripts/wav_match/matches.csv \
  --coverage scripts/wav_match/coverage.csv
```

出力 `coverage.csv`:

| 列 | 内容 |
| --- | --- |
| `origin` | 機種（SK-1/MT-40…） |
| `type` | one_shot / loop |
| `category` | 音色/ドラム/リズム名（例 Brass Ensemble, Kick, Rock） |
| `ref_files` | その音色グループの購入ファイル数 |
| `present` | 本体に有りなら True（しきい値以上で一致する本体パッドがある） |
| `best_similarity` | そのグループの最良一致類似度 |
| `device_slots` | 一致した本体スロット（b1-p5 等） |

`present=False` ＝ その元機種サウンドは本体プリセットに**収録されていない**可能性。
判定は `--threshold` に依存するので、必要に応じて調整する。

## データ構造の前提

```
本体:  {bank番号}_{bank名}/{pad番号}.wav      例) 01_Preset01/03.wav → Bank1 Pad3
       （0始まり bank00/.. の場合は --bank-offset 1）

購入:  one shot_tone/{音色}/{機種}_{MIDI番号}_{音名}_{音色名}.wav
         例) one shot_tone/Brass Ensemble/SK-1_53_F-3_BrassEnsemble.wav
       one shot_rhythm/{ドラム}/{機種}_{名前}{番号}.wav
         例) one shot_rhythm/Kick/SK-1_Kick1.wav
       loop/{リズム}/{機種}_{MIDI番号}_{音名}_{名前}{番号}.wav
         例) loop/Rock/MT-40_36_C-2_Rock1.wav
```

- 本体はパスから **bank/pad が確定** → 結果は該当スロットに直接対応づく。
- 購入はファイル名から **機種・音名・音色名**、パスから **カテゴリ・one_shot/loop** を抽出。
  - ※2番目の数字は MIDI ノート番号（48=C3, 53=F3…）。音名は `F-3` / `F-sharp-3` 形式。
  - 音色は MIDI 53〜84 等の全鍵＋変種（`-env12` 等）でサンプリングされており、購入セットは
    数千ファイル規模。埋め込み計算に数分かかる場合がある。

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
| `similarity` | 類似度(0〜1)。exact は 1.0、xcorr は波形相関値 |
| `method` | `exact`（完全一致）/ `xcorr`（波形相関）/ `mfcc` |
| `confident` | exact もしくはしきい値以上なら True |
| `dup_group` | 本体内の重複クラスタID（同IDは同一音の可能性） |

行は bank → pad 順に並ぶので、そのままスロット単位で確認・取り込みしやすい。

## 照合の流れ（3段階）

1. **完全一致（exact）**: PCMサンプル（int16・ネイティブSR）の内容ハッシュで一致を探す。
   本体と購入が**同一録音・同一フォーマット**なら即確定（画像の完全重複検出と同じ）。`--no-exact` で無効化。
2. **波形相関（xcorr）**: 完全一致しなかったものだけ、MFCCで候補を絞り波形相互相関で最良を選ぶ。
   SR違い・トリム・正規化などで完全一致しない「同じ音」を拾う。
3. （`--no-refine` 指定時）**MFCC のみ**で最近傍（高速・低精度）。

## 運用の流れ（想定）

1. 本体WAV と 購入WAV をフォルダに用意して実行
2. `confident=True` は由来を**自動確定**として採用
3. `confident=False` は耳で確認（しきい値は調整可）
4. `dup_group` が同じものは重複配置 → DB では1音にまとめる/相互参照
5. 確定した由来は、将来的に管理者ページの一括取り込みへ連携予定

## 仕組み・調整（2段照合）

1. **候補絞り込み（MFCC）**: 各WAVを「無音トリム → 正規化 → MFCC 平均/標準偏差」でベクトル化し、
   コサイン類似度で上位 `--topk` 件を候補に。
2. **精緻化（波形相互相関）**: 候補だけを低SR波形にして正規化相互相関を計算し、最良を選ぶ。
   本体プリセットは購入フルセットと**同じ録音**のため、同一音は ~1.0、別物は明確に低く出る。
   `similarity` 列はこの相関値。

- MFCC だけだと「音色が似ている別の音」を誤って拾うことがある（コサインが高く出やすい）。
  波形相関での精緻化により、その誤マッチを大幅に減らせる。
- 速度優先なら `--no-refine`（MFCCのみ）。精度優先なら既定（精緻化あり）。
- まだ誤マッチが残る場合は `--topk` を増やす（候補に正解が入っていない可能性を潰す）か、
  `--refine-seconds` を伸ばす。`--threshold` は `confident` の境界調整。

## 注意

- 購入データは**個人利用の範囲**で照合に使う。音源そのものは再配布しない（`.gitignore` 推奨）。
- 完全自動で100%にはならない前提（自動確定／要確認の二段構え）。
