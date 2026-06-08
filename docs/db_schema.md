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
- 集計用の Cloud Functions は Admin SDK 権限で `presets` を更新。

## 未確定・要検討事項

- 工場プリセットの既定配置が機体間で共通か（defaultBank/Pad の信頼性）※未確認
- 未ログインユーザーへの公開範囲（ランキングのみ等）※要検討
- スロット上書き履歴の要否 ※要検討
