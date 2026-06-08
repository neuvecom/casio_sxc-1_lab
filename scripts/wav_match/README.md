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
| `--threshold` | 0.85 | `confident=True`（自動確定）とみなすスペクトログラム類似度 |
| `--no-exact` | （無し） | 完全一致照合をやめる |
| `--frames` | 48 | スペクトログラムの時間正規化フレーム数 |
| `--mel` | 64 | 周波数圧縮の本数 |
| `--sr` | 22050 | 解析サンプルレート |
| `--dup-threshold` | 0.97 | 本体WAV同士がこれ以上似ていたら同一音（重複）とみなす |
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
| `similarity` | 類似度(0〜1)。exact は 1.0、spec はスペクトログラム・コサイン |
| `method` | `exact`（完全一致）/ `spec`（スペクトログラム） |
| `confident` | exact もしくはしきい値以上なら True |
| `dup_group` | 本体内の重複クラスタID（同IDは同一音の可能性） |

行は bank → pad 順に並ぶので、そのままスロット単位で確認・取り込みしやすい。

## 照合の流れ（2段階）

1. **完全一致（exact）**: PCMサンプル（int16・ネイティブSR）の内容ハッシュで一致を探す。
   本体と購入が**同一録音・同一フォーマット**なら即確定（画像の完全重複検出と同じ）。`--no-exact` で無効化。
2. **スペクトログラム（spec）**: 完全一致しなかったものは、**位相を無視し時間長を固定化した
   対数マグニチュード・スペクトログラム埋め込み**のコサイン類似度で最良を選ぶ。
   本体音が購入版と「同じ素材だが再レンダリング/テンポ違い/長さ違い/位相違い」でも検出できる
   （波形そのものは一致しないため、波形相関では取れない）。

> 背景: SXC-1 のループ等は購入フルセットと音は同じでも**波形が別物（再レンダリング）**のことが多く、
> 波形相関では検出できない。マグニチュード・スペクトログラムは位相非依存なので、これらを拾える。
> 実測で「同一ループ ≒ 0.96 / 別音 ≦ 0.79」と明確に分離する。

## 運用の流れ（想定）

1. 本体WAV と 購入WAV をフォルダに用意して実行
2. `confident=True` は由来を**自動確定**として採用
3. `confident=False` は耳で確認（しきい値は調整可）
4. `dup_group` が同じものは重複配置 → DB では1音にまとめる/相互参照
5. 確定した由来は、将来的に管理者ページの一括取り込みへ連携予定

## 調整

- スペクトログラム埋め込み: 無音トリム → 正規化 → 対数マグニチュード・スペクトログラム →
  周波数を `--mel` 本に圧縮 → 時間を `--frames` 本に線形補間で固定長化 → L2正規化。
  位相を無視し時間長を揃えるため、再レンダリング・テンポ差・長さ違いに強い。
- 誤マッチ（別の音を高スコアで拾う）が増えたら `--threshold` を上げる。逆に取りこぼしが
  多ければ下げる。`--frames` / `--mel` を増やすと識別力が上がる（計算は重くなる）。
- 重要: 自動確定（exact＋しきい値超え）だけを信用し、それ以外は「未同定」として
  人手で確認するのが安全（`import_matches.mjs --confident-only`）。

## 注意

- 購入データは**個人利用の範囲**で照合に使う。音源そのものは再配布しない（`.gitignore` 推奨）。
- 完全自動で100%にはならない前提（自動確定／要確認の二段構え）。
