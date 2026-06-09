# Firestore データ設計（ドラフト）

> 状態: ドラフト。**管理者キュレーション型**の設計（プリセットは管理者のみ書き込み）。
> 確定したら更新。

## 設計方針

- **共通データ**（全ユーザーで共有・読み取り）と**個別データ**（ユーザー固有）を分離。
- プリセット音色は**管理者のみ**が作成・編集（一般ユーザーは読み取り専用）。
- ランキング用の集計値（お気に入り数・★平均）は非正規化して `presets` に持たせ、
  Cloud Functions で更新する（クライアントからの直接集計・改ざんを避ける）。

## 管理者（admin）ロールの実装

- Firebase Authentication の **Custom Claims**（`admin: true`）で管理者を識別する。
  - 設定は Admin SDK 経由で一度行う（運営アカウントに付与）。
  - セキュリティルールで `request.auth.token.admin == true` を判定。
- 代替案: `admins/{uid}` ドキュメントの存在で判定（ルールが読み取り1回分重くなる）※要検討。

## コレクション構成

### `users/{uid}` — ユーザープロフィール（個別）
```
displayName: string
createdAt: timestamp
```

### `presets/{presetId}` — プリセット情報（管理者が作成・編集 / 全員が読み取り）
```
name: string            # 音色名（管理者が採取して命名）
category: string        # Kick / Snare / Hihat / Loop / Synth / Voice / SE ...
group: number|null      # グループ（1〜16）
color: string           # 色名（NeonYellow / Orange / Red / Purple / Blue / LightBlue / Green / LightGreen）。未指定は空文字
isPreset: boolean       # 工場プリセットかどうか（一覧で「P」表示。既定 true）
oneShot: boolean        # ワンショット
loop: boolean           # ループ
bpm: number|null        # テンポ（ループ素材など）
defaultBank: number|null  # 工場出荷時の既定バンク ※未確認
defaultPad: number|null   # 工場出荷時の既定パッド ※未確認
description: string
tags: string[]
ratingAvg: number       # 集計値（Cloud Functions 更新）
ratingCount: number     # 集計値
favoriteCount: number   # 集計値（ランキングの主指標）
createdAt: timestamp
updatedAt: timestamp
```

> 由来(origin)・WAV照合(match)は方針転換により保持しない（2026-06-08）。
> 検証の結果、本体プリセットの大半は元機種の音そのままではなく加工/派生/オリジナルで、
> 由来を断定できるのは完全一致した一部のみ。レトロ機の再現は「ユーザーが購入した
> サンプルパックを各スロットに登録する（type=sample）」運用で対応する。
> 調査・照合ツールは `scripts/wav_match/`・`docs/reference/` に記録として残す。

### `users/{uid}/slots/{slotId}` — 自分の1280スロット（個別）
`slotId` は `b{bank}-p{pad}`（bank: 1〜80, pad: 1〜16）。
```
bank: number            # 1〜80
pad: number             # 1〜16
type: "preset" | "sample" | "empty"
presetId: string|null   # type=preset のとき presets を参照
sampleName: string|null # type=sample のとき自分のサンプル名
memo: string
updatedAt: timestamp
```
- 空き状況ビジュアライズは本コレクションを 80×16 grid に描画。
- ドキュメント未作成＝空きスロットとして扱えば書き込み量を節約可能 ※要検討。

### `defaultSlots/{slotId}` — 新規ユーザーの初期配置（共通 / 管理者が保存）
管理者が自分の `users/{adminUid}/slots` で組んだ配置を「現在の配置をデフォルトに保存」
ボタンでスナップショットしたもの。`slotId` と各フィールドは `users/{uid}/slots` と同形。
```
bank: number
pad: number
type: "preset" | "sample"   # 空き（empty）は保存しない
presetId: string|null
sampleName: string|null
memo: string
updatedAt: timestamp
```
- **初回ログイン時のコピー**: 新規ユーザーは `users/{uid}` プロフィールが未作成のとき
  「初回」と判定し、`defaultSlots` 全件を自分の `users/{uid}/slots` へコピーしてから
  プロフィールを作成する（`src/lib/users.js` の `ensureUserInitialized`）。冪等で、
  2回目以降のログインでは何もしない。
- **既存会員の保護**: プロフィール導入前から登録している会員はプロフィールが無いが、
  すでにスロットを持っていればコピーをスキップし（配置を上書きしない）、プロフィールの
  作成のみ行う（`seededSlotCount: 0`）。コピーするのはスロットが0件のときだけ。
- 保存は「全置換」: 現在配置に無い既存デフォルトは削除し、使用中スロットのみ書き込む
  （`src/lib/defaultSlots.js` の `saveDefaultSlots`）。

### `users/{uid}` — プロフィール（個別 / 初回ログインで作成）
```
displayName: string
createdAt: timestamp
seededSlotCount: number   # 初回にデフォルトからコピーしたスロット数の記録
defaultsVersion: number   # 確認（取り込み or 見送り）済みのデフォルト配置バージョン
```
- ドキュメントの存在を「初回ログイン済みフラグ」として利用する。
- `defaultsVersion` を `meta/defaultSlots.version` と比較し、`meta` の方が新しければ
  バンク配置画面で「更新あり」バナーを表示する。

### `meta/defaultSlots` — デフォルト配置の更新メタ（共通 / 管理者が更新）
```
version: number      # 保存のたびに +1（更新通知の判定に使う）
slotCount: number    # 公開中デフォルトの使用中スロット数
updatedAt: timestamp
```
- 管理者が「現在の配置をデフォルトに保存」すると `defaultSlots` 更新と同時に
  `version` を +1。各ユーザーは自分の `defaultsVersion` より新しければ通知を受け、
  **空きスロットだけ**デフォルトを取り込める（`fillEmptySlotsFromDefaults`）。
- 取り込み／見送りのいずれでも `defaultsVersion` を最新に更新し、以後は通知しない。

### `users/{uid}/userPresetMeta/{presetId}` — プリセットへの個別メモ・評価（個別）
```
rating: number|null     # 1〜5（集計の元データ）
memo: string
favorite: boolean       # お気に入り（集計の元データ）
updatedAt: timestamp
```

## 集計・ランキング（フェーズ2）

- `users/{uid}/userPresetMeta/{presetId}` の `favorite` / `rating` の書き込みをトリガに
  Cloud Functions で対象 `presets/{presetId}` の `favoriteCount` / `ratingAvg` /
  `ratingCount` を再計算。
- ランキングは `presets` を `favoriteCount`（主）/ `ratingAvg` で降順クエリ。

## セキュリティルール方針（概要）

- `users/{uid}/**`: 本人（`request.auth.uid == uid`）のみ読み書き可。
- `presets/**`:
  - 読み取り: ログインユーザー（公開ランキングを未ログインにも見せるなら一部緩和）※要検討
  - 作成・更新・削除: **管理者のみ**（`request.auth.token.admin == true`）
  - 集計フィールドはクライアント直書き禁止 → Cloud Functions のみ更新
- `defaultSlots/**`:
  - 読み取り: ログインユーザー（新規ユーザーが初回コピーするため）
  - 作成・更新・削除: **管理者のみ**
- `meta/**`:
  - 読み取り: ログインユーザー（更新通知の判定にバージョンを読む）
  - 作成・更新・削除: **管理者のみ**
- 集計用の Cloud Functions は Admin SDK 権限で `presets` を更新。

## 未確定・要検討事項

- 工場プリセットの既定配置が機体間で共通か（defaultBank/Pad の信頼性）※未確認
- 未ログインユーザーへの公開範囲（ランキングのみ等）※要検討
- スロット上書き履歴の要否 ※要検討
