// 管理者ページ（フェーズ0）：プリセットの登録・編集・削除。
// 実機を鳴らしながら音色を採取して登録する想定。
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CATEGORIES,
  GROUPS,
  COLORS,
  colorHex,
  subscribePresets,
  addPreset,
  updatePreset,
  deletePreset,
} from '../lib/presets.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { subscribeSlots } from '../lib/slots.js'
import { saveDefaultSlots, subscribeDefaultsMeta } from '../lib/defaultSlots.js'

// 登録済み一覧のバンク切り替えタブ（プリセットは B1〜B14）
const PRESET_BANK_MAX = 14
const BANK_TABS = [...Array.from({ length: PRESET_BANK_MAX }, (_, i) => i + 1), 'unset', 'all']

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166M18.16 5.79l-.83 13.883A2.25 2.25 0 0115.084 21H8.916a2.25 2.25 0 01-2.244-2.327L5.84 5.79m12.32 0a48.108 48.108 0 00-3.478-.397m0 0V4.875c0-.621-.504-1.125-1.125-1.125h-3.026c-.621 0-1.125.504-1.125 1.125v.518m4.276 0a48.11 48.11 0 00-4.276 0" />
    </svg>
  )
}

const EMPTY_FORM = {
  name: '',
  category: 'Other',
  group: '',
  color: '',
  isPreset: true,
  oneShot: false,
  loop: false,
  bpm: '',
  defaultBank: '',
  defaultPad: '',
  description: '',
  tags: '',
}

export default function Admin() {
  const { user } = useAuth()
  const [presets, setPresets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null) // null=新規, それ以外=編集中
  const [busy, setBusy] = useState(false)
  const [selectedBank, setSelectedBank] = useState(1) // 一覧の表示バンク

  // 自分（管理者）の現在のスロット配置。「デフォルトに保存」の元データに使う。
  const [mySlots, setMySlots] = useState({})
  const [savingDefault, setSavingDefault] = useState(false)
  const [defaultMsg, setDefaultMsg] = useState('')
  const [defaultsMeta, setDefaultsMeta] = useState(null) // 公開中のデフォルト { version, slotCount, updatedAt }

  // バンクごとの件数
  const counts = useMemo(() => {
    const m = {}
    presets.forEach((p) => {
      const k = p.defaultBank ?? 'unset'
      m[k] = (m[k] || 0) + 1
    })
    return m
  }, [presets])

  // 選択中バンクのプリセット（パッド順 → 名前順）
  const visible = useMemo(() => {
    let list
    if (selectedBank === 'all') list = presets
    else if (selectedBank === 'unset') list = presets.filter((p) => p.defaultBank == null)
    else list = presets.filter((p) => p.defaultBank === selectedBank)
    return [...list].sort(
      (a, b) =>
        (a.defaultPad ?? 99) - (b.defaultPad ?? 99) ||
        (a.name || '').localeCompare(b.name || ''),
    )
  }, [presets, selectedBank])

  useEffect(() => {
    const unsub = subscribePresets(
      (list) => {
        setPresets(list)
        setLoading(false)
      },
      (e) => {
        setError(`読み込みに失敗しました：${e.message}`)
        setLoading(false)
      },
    )
    return unsub
  }, [])

  // 管理者自身のスロット配置を購読（デフォルト保存の元データ）
  useEffect(() => {
    if (!user) return
    const unsub = subscribeSlots(
      user.uid,
      setMySlots,
      (e) => setError(`配置の読み込みに失敗しました：${e.message}`),
    )
    return unsub
  }, [user])

  // 公開中のデフォルト配置メタ（バージョン・更新日時）を購読
  useEffect(() => {
    const unsub = subscribeDefaultsMeta(setDefaultsMeta, () => {})
    return unsub
  }, [])

  // 使用中（空きでない）スロット数
  const usedSlotCount = useMemo(
    () => Object.values(mySlots).filter((s) => s?.type && s.type !== 'empty').length,
    [mySlots],
  )

  // 現在の配置を defaultSlots に保存（新規ユーザーの初期プリセットになる）
  const handleSaveDefault = async () => {
    if (
      !window.confirm(
        `現在のあなたの配置（使用中 ${usedSlotCount} スロット）を、新規ユーザーの初期配置（デフォルト）として保存します。\n既存のデフォルトは上書きされます。よろしいですか？`,
      )
    )
      return
    setDefaultMsg('')
    setSavingDefault(true)
    try {
      const count = await saveDefaultSlots(mySlots)
      setDefaultMsg(
        `デフォルト配置を保存しました（${count} スロット）。` +
          '各ユーザーは次回のバンク配置画面で取り込み通知を受け取ります。',
      )
    } catch (err) {
      setError(`デフォルト配置の保存に失敗しました：${err.message}`)
    } finally {
      setSavingDefault(false)
    }
  }

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const updateCheck = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.checked }))

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('音色名は必須です')
      return
    }
    setError('')
    setBusy(true)
    try {
      if (editingId) await updatePreset(editingId, form)
      else await addPreset(form)
      resetForm()
    } catch (err) {
      setError(`保存に失敗しました：${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  const handleEdit = (p) => {
    setEditingId(p.id)
    setForm({
      name: p.name || '',
      category: p.category || 'Other',
      group: p.group ?? '',
      color: p.color || '',
      isPreset: p.isPreset !== false,
      oneShot: !!p.oneShot,
      loop: !!p.loop,
      bpm: p.bpm ?? '',
      defaultBank: p.defaultBank ?? '',
      defaultPad: p.defaultPad ?? '',
      description: p.description || '',
      tags: (p.tags || []).join(', '),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (p) => {
    if (!window.confirm(`「${p.name}」を削除しますか？`)) return
    try {
      await deletePreset(p.id)
      if (editingId === p.id) resetForm()
    } catch (err) {
      setError(`削除に失敗しました：${err.message}`)
    }
  }

  const inputClass =
    'w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500'

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">管理者ページ — プリセット登録</h1>
        <Link to="/admin/feedback" className="text-sm text-emerald-400 hover:underline">
          フィードバック一覧 →
        </Link>
      </div>
      <p className="mt-1 text-sm text-slate-400">
        実機を鳴らしながら音色を採取して登録します。
      </p>

      {/* デフォルト配置の保存：自分のバンク配置を新規ユーザーの初期プリセットにする */}
      <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-slate-200">
              新規ユーザーの初期配置（デフォルト）
            </div>
            <p className="mt-1 text-xs text-slate-400">
              <Link to="/banks" className="text-emerald-400 hover:underline">
                バンク配置
              </Link>
              で組んだあなたの現在の配置を保存すると、新規ユーザーの初回ログイン時に
              コピーされ初期プリセットとして入ります。既存ユーザーには取り込み通知が届きます。
              現在の使用中スロット：
              <span className="font-semibold text-slate-200">{usedSlotCount}</span>
            </p>
            {defaultsMeta && (defaultsMeta.version ?? 0) > 0 && (
              <p className="mt-1 text-xs text-slate-500">
                公開中のデフォルト：v{defaultsMeta.version}（{defaultsMeta.slotCount} スロット）
                {defaultsMeta.updatedAt?.toDate &&
                  ` / 更新 ${defaultsMeta.updatedAt.toDate().toLocaleString('ja-JP')}`}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleSaveDefault}
            disabled={savingDefault || usedSlotCount === 0}
            className="shrink-0 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {savingDefault ? '保存中…' : '現在の配置をデフォルトに保存'}
          </button>
        </div>
        {defaultMsg && (
          <div className="mt-3 rounded-md border border-emerald-700/50 bg-emerald-950/40 p-2 text-xs text-emerald-300">
            {defaultMsg}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-rose-600/50 bg-rose-950/40 p-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* 登録／編集フォーム */}
      <form
        onSubmit={handleSubmit}
        className="mt-5 rounded-lg border border-slate-800 bg-slate-950 p-4"
      >
        <div className="mb-2 text-sm font-medium text-slate-300">
          {editingId ? 'プリセットを編集' : '新規プリセット'}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            音色名 <span className="text-rose-400">*</span>
            <input className={inputClass} value={form.name} onChange={update('name')} />
          </label>
          <label className="text-sm">
            カテゴリ
            <select className={inputClass} value={form.category} onChange={update('category')}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            グループ（1〜16）
            <select className={inputClass} value={form.group} onChange={update('group')}>
              <option value="">（未設定）</option>
              {GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </label>
          <div className="text-sm">
            色
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c.name }))}
                  title={c.name}
                  className={`h-7 w-7 rounded-full border-2 ${
                    form.color === c.name ? 'border-white' : 'border-slate-600'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, color: '' }))}
                className={`h-7 rounded-full border px-2 text-xs ${
                  form.color === ''
                    ? 'border-white text-white'
                    : 'border-slate-600 text-slate-400'
                }`}
              >
                なし
              </button>
            </div>
          </div>
          <div className="flex items-end gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isPreset} onChange={updateCheck('isPreset')} />
              プリセット
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.oneShot} onChange={updateCheck('oneShot')} />
              ワンショット
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.loop} onChange={updateCheck('loop')} />
              ループ
            </label>
          </div>
          <label className="text-sm">
            BPM
            <input
              type="number" min="0" step="0.1"
              className={inputClass} value={form.bpm} onChange={update('bpm')}
              placeholder="例：120"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              既定バンク
              <input
                type="number" min="1" max="80"
                className={inputClass} value={form.defaultBank} onChange={update('defaultBank')}
              />
            </label>
            <label className="text-sm">
              既定パッド
              <input
                type="number" min="1" max="16"
                className={inputClass} value={form.defaultPad} onChange={update('defaultPad')}
              />
            </label>
          </div>
          <label className="text-sm sm:col-span-2">
            説明
            <input className={inputClass} value={form.description} onChange={update('description')} />
          </label>
          <label className="text-sm sm:col-span-2">
            タグ（カンマ区切り）
            <input className={inputClass} value={form.tags} onChange={update('tags')} placeholder="lofi, hiphop" />
          </label>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {editingId ? '更新する' : '登録する'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-slate-700 px-4 py-2 font-medium text-slate-300 hover:bg-slate-800"
            >
              キャンセル
            </button>
          )}
        </div>
      </form>

      {/* 一覧 */}
      <div className="mt-6">
        <div className="mb-2 text-sm text-slate-400">
          登録済み：{presets.length} 件
        </div>

        {/* バンク切り替えタブ */}
        <div className="mb-3 flex flex-wrap gap-1">
          {BANK_TABS.map((b) => {
            const active = selectedBank === b
            const label = b === 'all' ? 'すべて' : b === 'unset' ? '未設定' : `B${b}`
            const c = b === 'all' ? presets.length : counts[b] || 0
            return (
              <button
                key={b}
                onClick={() => setSelectedBank(b)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                  active
                    ? 'bg-emerald-600 text-white'
                    : 'border border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {label}
                {c > 0 && <span className="ml-1 opacity-70">({c})</span>}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="text-slate-400">読み込み中…</div>
        ) : presets.length === 0 ? (
          <div className="text-slate-500">まだ登録がありません。</div>
        ) : visible.length === 0 ? (
          <div className="text-slate-500">このバンクにはプリセットがありません。</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th className="px-3 py-2">音色名</th>
                  <th className="px-3 py-2">カテゴリ</th>
                  <th className="px-3 py-2">グループ</th>
                  <th className="px-3 py-2">種別</th>
                  <th className="px-3 py-2">BPM</th>
                  <th className="px-3 py-2">既定</th>
                  <th className="px-3 py-2">説明</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id} className="border-t border-slate-800">
                    <td className="px-3 py-2 font-medium">
                      <span className="flex items-center gap-2">
                        {colorHex(p.color) && (
                          <span
                            className="inline-block h-3 w-3 shrink-0 rounded-full border border-slate-600"
                            style={{ backgroundColor: colorHex(p.color) }}
                            title={p.color}
                          />
                        )}
                        {p.name}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-300">{p.category}</td>
                    <td className="px-3 py-2 text-slate-300">{p.group || '—'}</td>
                    <td className="px-3 py-2 text-slate-400">
                      {[
                        p.isPreset !== false && 'P',
                        p.oneShot && 'ワンショット',
                        p.loop && 'ループ',
                      ]
                        .filter(Boolean)
                        .join(' / ') || '—'}
                    </td>
                    <td className="px-3 py-2 text-slate-400">{p.bpm ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-400">
                      {p.defaultBank != null && p.defaultPad != null
                        ? `B${p.defaultBank}-P${p.defaultPad}`
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-slate-400">
                      <div className="max-w-[18rem] truncate" title={p.description}>
                        {p.description || '—'}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(p)}
                        title="編集"
                        aria-label="編集"
                        className="inline-flex rounded p-1.5 text-emerald-400 hover:bg-slate-800"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        title="削除"
                        aria-label="削除"
                        className="inline-flex rounded p-1.5 text-rose-400 hover:bg-slate-800"
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
