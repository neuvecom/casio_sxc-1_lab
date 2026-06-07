// プリセット一覧（一般ユーザー向け）。
// 管理者が登録したプリセットを閲覧し、お気に入り・★評価・メモを記録できる。
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { subscribePresets, colorHex } from '../lib/presets.js'
import { subscribeUserPresetMeta, setUserPresetMeta } from '../lib/userPresetMeta.js'

// クリックできる★評価（1〜5、同じ星をもう一度押すと解除）
function Stars({ value, onChange }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(value === n ? 0 : n)}
          className={`text-lg leading-none ${
            n <= value ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
          }`}
          title={`${n} つ星`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function Presets() {
  const { user } = useAuth()
  const [presets, setPresets] = useState([])
  const [meta, setMeta] = useState({}) // presetId -> { favorite, rating, memo }
  const [memoDraft, setMemoDraft] = useState({}) // 編集中のメモ
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [favOnly, setFavOnly] = useState(false)

  useEffect(() => {
    const unsub = subscribePresets(
      (list) => {
        setPresets(list)
        setLoading(false)
      },
      (e) => {
        setError(`プリセットの読み込みに失敗：${e.message}`)
        setLoading(false)
      },
    )
    return unsub
  }, [])

  useEffect(() => {
    if (!user) return
    const unsub = subscribeUserPresetMeta(
      user.uid,
      setMeta,
      (e) => setError(`メモの読み込みに失敗：${e.message}`),
    )
    return unsub
  }, [user])

  const save = (presetId, patch) =>
    setUserPresetMeta(user.uid, presetId, patch).catch((e) =>
      setError(`保存に失敗：${e.message}`),
    )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return presets.filter((p) => {
      if (favOnly && !meta[p.id]?.favorite) return false
      if (!q) return true
      const hay = [p.name, p.category, p.origin, p.description, ...(p.tags || [])]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [presets, meta, search, favOnly])

  return (
    <div>
      <h1 className="text-xl font-bold">プリセット一覧</h1>
      <p className="mt-1 text-sm text-slate-400">
        お気に入り・★評価・メモを記録できます（自分だけに保存されます）
      </p>

      {error && (
        <div className="mt-3 rounded-md border border-rose-600/50 bg-rose-950/40 p-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* 検索・フィルタ */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          placeholder="検索（音色名・カテゴリ・由来・タグ）"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[16rem] flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500"
        />
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={favOnly}
            onChange={(e) => setFavOnly(e.target.checked)}
          />
          お気に入りのみ
        </label>
      </div>

      {loading ? (
        <div className="mt-6 text-slate-400">読み込み中…</div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 text-slate-500">
          {presets.length === 0
            ? 'まだプリセットが登録されていません。'
            : '条件に合うプリセットがありません。'}
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {filtered.map((p) => {
            const m = meta[p.id] || {}
            const draft = memoDraft[p.id]
            const memoValue = draft !== undefined ? draft : m.memo || ''
            return (
              <div key={p.id} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 font-semibold">
                      {colorHex(p.color) && (
                        <span
                          className="inline-block h-3 w-3 shrink-0 rounded-full border border-slate-600"
                          style={{ backgroundColor: colorHex(p.color) }}
                          title={p.color}
                        />
                      )}
                      {p.name}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-slate-400">
                      {p.isPreset !== false && (
                        <span className="rounded bg-emerald-700 px-1.5 py-0.5 font-bold text-white">P</span>
                      )}
                      <span className="rounded bg-slate-800 px-1.5 py-0.5">{p.category}</span>
                      {p.group != null && (
                        <span className="rounded bg-slate-800 px-1.5 py-0.5">G{p.group}</span>
                      )}
                      {p.origin && p.origin !== 'unknown' && (
                        <span className="rounded bg-slate-800 px-1.5 py-0.5">{p.origin}</span>
                      )}
                      {p.oneShot && <span className="rounded bg-slate-800 px-1.5 py-0.5">ワンショット</span>}
                      {p.loop && <span className="rounded bg-slate-800 px-1.5 py-0.5">ループ</span>}
                      {p.bpm != null && <span className="rounded bg-slate-800 px-1.5 py-0.5">{p.bpm} BPM</span>}
                      {p.defaultBank != null && p.defaultPad != null && (
                        <span>B{p.defaultBank}-P{p.defaultPad}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => save(p.id, { favorite: !m.favorite })}
                    title="お気に入り"
                    className={`text-xl leading-none ${
                      m.favorite ? 'text-rose-400' : 'text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    {m.favorite ? '♥' : '♡'}
                  </button>
                </div>

                {p.description && (
                  <p className="mt-2 text-sm text-slate-300">{p.description}</p>
                )}
                {p.tags?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.tags.map((t) => (
                      <span key={t} className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs text-slate-400">評価</span>
                  <Stars value={m.rating || 0} onChange={(v) => save(p.id, { rating: v })} />
                </div>

                <textarea
                  rows={2}
                  placeholder="メモ（例：抜けの良いキック）"
                  value={memoValue}
                  onChange={(e) =>
                    setMemoDraft((d) => ({ ...d, [p.id]: e.target.value }))
                  }
                  onBlur={() => {
                    if (draft !== undefined && draft !== (m.memo || '')) {
                      save(p.id, { memo: draft })
                    }
                  }}
                  className="mt-2 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
