# 搭載元ビンテージ機種 プリセット音色リファレンス

> 目的: SXC-1 の各プリセット音の「由来」を突き合わせて判断するための正解表。
> SXC-1 は旧カシオ機のサウンドを収録しているが、公式の全プリセット名は非公開のため、
> 元機種の工場出荷音色と照合して由来を推定する。
>
> **調査方法の注意**: 本調査は Web 検索のスニペット（公式マニュアル抜粋・Wikipedia・
> Vintage Synth Explorer・ManualsLib 等）の突き合わせによる。調査環境では各ページの
> 本文直接取得（WebFetch）が 403 で不可だったため、**一次資料（マニュアル PDF 原本）の
> 逐語確認は未完了**。複数ソース一致は「確定」、単独・矛盾は「※未確認」と明記する。
> 最終確定には各「主要ソース」の原本確認を推奨。
> 調査日: 2026-06-07

---

## ⚠️ 最重要: SXC-1 が公式に挙げる由来は「SK-1」「MT-40」の2機種のみ

- **公式（Casio JP プレスリリース・製品ページ）が明示するビンテージ機種は SK-1 と MT-40 のみ。**
  出典: [Casio JP リリース](https://www.casio.co.jp/release/2026/0421-sxc-1/) ／
  [Casio JP 製品ページ](https://www.casio.com/jp/creator-economy/sampler/product.SXC-1/)
- **SK-5・CZ-101 は海外メディア（gearnews / Synth Anatomy / noizefield）のみが言及 → ※未確認。**
  特に「CZ-101 の brass / Reese パッチ収録」は gearnews 単独記述で信頼度最低（※未確認）。
- プリセットは総数 **208音**（ワンショット／ループ／SE 含む）、**バンク1〜14に配置**。
  → 実機観察「プリセットはバンク14まで」と整合。
  出典: [Casio 公式 note 社員レビュー](https://note-pr.casio.co.jp/n/n5536313cc775)
- MT-40 / SK-1 の**全収録音は別サービス「Waves Place」で配信**（本体内蔵は一部）。同上 note。

> 由来判断の優先度: **まず SK-1・MT-40 を疑う**。SK-5・CZ-101 由来らしき音があれば
> 「推定（※未確認）」として記録し、CASIO への問い合わせ材料にする。

---

## 1. Casio SK-1 (1985) — 確定

- **プリセット音色: 8音**（PCM 5 + 加算合成 3）
  - PCM: `Piano` / `Brass Ensemble` / `Trumpet` / `Synth Drums` / `Human Voice`
  - 加算合成: `Flute` / `Pipe Organ` / `Jazz Organ`
- **リズム: 11種**（Disco, Rock, Pops, March, Samba, Bossa Nova, Rhumba, Swing, Slow Rock, Waltz, + 4 Beat/8 Beat ※表記揺れ）
- **デモ曲: 1**（"Toy Symphony"）
- 専用パッド（効果音）は **無し**（それは SK-5 の機能）
- 主要ソース: [Wikipedia](https://en.wikipedia.org/wiki/Casio_SK-1) ／
  [Vintage Synth](https://www.vintagesynth.com/casio/sk-1) ／
  [Service Manual (archive.org)](https://archive.org/details/Casio_SK-1_Service_Manual)

## 2. Casio SK-5 — 確定（ただし SXC-1 収録は※未確認）

- **プリセット音色: 8音** — `Piano` / `Vibraphone` / `Dog` / `Surf` / `Trumpet` / `Pipe Organ` / `Chorus` / `Flute`
  （"Dog" "Surf" は実在の工場プリセット＝SK-5 の特徴）
- **ドラムパッド: 4音** — `Lion`（ライオンの咆哮）/ `Laser Gun` / `Hi Bongo` / `Low Bongo`
  （ピッチ可変ノブあり。一部資料の "conga" 表記は誤りで bongo が正）
- **リズム: 10種**（Rock1/Rock2, Disco1/Disco2, 16 Beat, March, Bossa Nova, Samba, Slow Rock, Waltz ＝ 8スタイル・10パターン）
- 主要ソース: [TableHooters](http://weltenschule.de/TableHooters/Casio_SK-8.html) ／
  [soundprogramming](https://soundprogramming.net/keyboards/casio/casio-sk-5/) ／
  [Manual (manualslib)](https://www.manualslib.com/manual/358569/Casio-Sk-5.html)

## 3. Casio CZ-101 (1984) — 確定（ただし SXC-1 収録は※未確認）

- **固定プリセット（ROM）: 16音**（INTERNAL 16・カートリッジ 16 は別＝書換可、対象外）

| # | パッチ名 | # | パッチ名 |
| --- | --- | --- | --- |
| 1 | BRASS ENS.1 | 9 | BRASS ENS.2 |
| 2 | TRUMPET | 10 | VIBRAPHONE |
| 3 | VIOLIN | 11 | CRISPY XYLOPHONE |
| 4 | STRING ENS.1 | 12 | SYNTH. STRINGS |
| 5 | ELEC. PIANO | 13 | FAIRY TALE |
| 6 | ELEC. ORGAN | 14 | ACCORDION |
| 7 | FLUTE | 15 | WHISTLE |
| 8 | SYNTH. BASS | 16 | PERCUSSION |

- 1〜8 は公式マニュアル（CZ-1000 p.20、ROM は CZ-101 と共通）で確定。
  9〜16 は二次資料（MATRIXSYNTH）由来で**逐語の公式確認は未完了（※一部未確認）**。
- 「32 classic patches」という表現は PRESET16 + INTERNAL 出荷時16 の合算。**固定 ROM は16が正**。
- 主要ソース: [CZ-1000 操作マニュアル p.20](https://www.manualslib.com/manual/1160175/Casio-Cz-1000.html?page=20) ／
  [Vintage Synth](https://www.vintagesynth.com/casio/cz-101) ／
  [MATRIXSYNTH](https://www.matrixsynth.com/2024/10/casio-cz-1000-32-classic-factory-patches.html)

## 4. Casio MT-40 (1981) — 確定

- **音色: メイン22音 + ベース1音**
  `electric piano, banjo, guitar, harpsichord, xylophone, celesta, glockenspiel, organ,
  accordion, pipe organ, oriental pipe, brass, cello, synthe fuzz, violin, trumpet,
  funny fuzz, st. ensemble, clarinet, flute, recorder, folk flute`
- **リズム: 6種** — `rock` / `samba` / `swing` / `slow rock` / `waltz` / `pops`
  （"disco" "bossa nova" は MT-40 には無い）
- **Sleng Teng リディムの正体**: 内蔵 `rock` プリセット＋"synchro"＋"D" ベースボタン（左から2番目）。
  作者は入社直後の**奥田弘子（Hiroko Okuda）**（1980年作）。"Under Me Sleng Teng"(1985) の土台。
- 主要ソース: [Wikipedia: MT-40](https://en.wikipedia.org/wiki/Casio_MT-40) ／
  [Wikipedia: Sleng Teng](https://en.wikipedia.org/wiki/Sleng_Teng) ／
  [nippon.com](https://www.nippon.com/en/japan-topics/g02027/)

---

## 由来判断 早見表（音色名 → 機種）

SXC-1 の音を聴いて名前を当てる際の逆引き。**太字＝公式確定の由来機種（SK-1/MT-40）**。

| カテゴリ | SK-1（確定） | MT-40（確定） | SK-5（※未確認） | CZ-101（※未確認） |
| --- | --- | --- | --- | --- |
| ピアノ系 | **Piano** | **electric piano, harpsichord** | Piano | ELEC. PIANO |
| 金管 | **Brass Ensemble, Trumpet** | **brass, trumpet** | Trumpet | BRASS ENS.1/2, TRUMPET |
| 弦 | — | **violin, cello, st. ensemble** | — | VIOLIN, STRING ENS.1, SYNTH. STRINGS |
| 笛/木管 | **Flute** | **flute, clarinet, recorder, folk flute, oriental pipe** | Flute | FLUTE, WHISTLE |
| オルガン | **Pipe Organ, Jazz Organ** | **organ, pipe organ, accordion** | Pipe Organ | ELEC. ORGAN, ACCORDION |
| 鍵盤打/マレット | — | **xylophone, celesta, glockenspiel** | Vibraphone | VIBRAPHONE, CRISPY XYLOPHONE |
| 声 | **Human Voice** | — | Chorus | — |
| ベース | — | **(bass 1音), rock bassline=Sleng Teng** | — | SYNTH. BASS |
| ドラム/打 | **Synth Drums** | — | — | PERCUSSION |
| 効果音/ネタ | — | — | Dog, Surf, Lion, Laser Gun, Hi/Low Bongo | FAIRY TALE |
| その他 | デモ:Toy Symphony | funny fuzz, synthe fuzz | — | — |

> 注: 同名・類似音が複数機種にまたがる（例: trumpet, flute, pipe organ）。実機で重複配置が
> 見られるのと整合的。確定2機種を優先しつつ、特徴的な音（Dog/Surf/Lion=SK-5、
> FAIRY TALE=CZ-101 等）が出たら「推定」として記録する。

## 残課題

- 一次資料（各マニュアル PDF 原本）での音色名逐語確認（本調査は検索スニペット依拠）。
- SXC-1 における SK-5・CZ-101 収録の有無の公式確認 → CASIO 問い合わせ事項。
- SK-1「4 Beat / 8 Beat」表記、CZ-101 9〜16 の綴りの最終確定。
