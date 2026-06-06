# Firestore データ設計（ドラフト）

> 状態: ドラフト。公式リストが無く**クラウドソーシング前提**の設計。確定したら更新。

## 設計方針

- **共通データ**（全ユーザーで共有）と**個別データ**（ユーザー固有）を分離。
- プリセット音色名は公式非公開のため、ユーザーが協力して埋める共有 DB とする。
- ランキング用の集計値（★平均・お気に入り数）は非正規化して `presets` に持たせ、
  Cloud Functions で更新する（クライアントからの直接集計を避ける）。

## コレクション構成

### `users/{uid}` — ユーザープロフィール（個別）
```
displayName: string
createdAt: timestamp
```

### `presets/{presetId}` — 共有プリセット情報（クラウドソーシング）
工場出荷音色のカタログ。全ユーザーで1つを育てる。
```
name: string            # ユーザー合意の呼称（例: "SK-1 Snare"）
category: string        # Kick / Snare / Hihat / Loop / Synth / Voice / SE ...
origin: string|null     # 由来（SK-1 / SK-5 / CZ-101 / MT-40 / unknown）
defaultBank: number|null  # 工場出荷時の既定バンク（判明していれば）※未確認
defaultPad: number|null   # 工場出荷時の既定パッド（判明していれば）※未確認
description: string
tags: string[]
status: "confirmed" | "unconfirmed"   # 確定 / 未確認
ratingAvg: number       # 集計値（Cloud Functions 更新）
ratingCount: number     # 集計値
favoriteCount: number   # 集計値
createdBy: uid
createdAt: timestamp
updatedAt: timestamp
```

#### `presets/{presetId}/ratings/{uid}` — 個別評価（集計の元データ）
```
rating: number          # 1〜5
updatedAt: timestamp
```

### `users/{uid}/slots/{slotId}` — 自分の1280スロット（個別）
`slotId` は `b{bank}-p{pad}`（bank: 1〜80, pad: 1〜16）で表現。
```
bank: number            # 1〜80
pad: number             # 1〜16
type: "preset" | "sample" | "empty"
presetId: string|null   # type=preset のとき presets を参照
sampleName: string|null # type=sample のとき自分のサンプル名
rating: number|null     # このスロットの中身への自分の評価
memo: string
updatedAt: timestamp
```
- 空き状況ビジュアライズは本コレクションを 80×16 grid に描画して表現。
- ドキュメントを作らない＝空きスロット、として扱えば書き込み量を節約可能 ※要検討。

### `users/{uid}/favorites/{presetId}` — お気に入り（個別 / 集計の元）
```
createdAt: timestamp
```

## セキュリティルール方針（概要）

- `users/{uid}/**`: 本人（`request.auth.uid == uid`）のみ読み書き可。
- `presets/**`: 読み取りは全員。作成・編集はログインユーザーのみ（荒らし対策は将来強化 ※要検討）。
- 集計フィールド（ratingAvg 等）はクライアント直書き禁止 → Cloud Functions のみ更新。

## ランキング（フェーズ2）

- `presets` を `ratingAvg` / `favoriteCount` で降順クエリ。
- 集計は `ratings` / `favorites` の書き込みをトリガに Cloud Functions で再計算。

## 未確定・要検討事項

- 工場プリセットの「同一性」をどう担保するか（既定配置が機体間で共通か）※未確認
- スロット上書き後の履歴管理の要否 ※要検討
- 共有 DB の編集競合・モデレーション方針 ※要検討
