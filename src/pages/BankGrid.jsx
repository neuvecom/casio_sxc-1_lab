// 1280スロット（80バンク × 16パッド）の空き状況ビジュアライズ。
// Firestore（users/{uid}/slots）と接続し、パッドをクリックするとモーダルで
// プリセット割当・サンプル名・メモを編集できる。ホバーで独自ツールチップを表示。
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { BANK_COUNT, PAD_COUNT, SLOT_COUNT, slotId } from '../lib/banks.js'
import { subscribeSlots, setSlot } from '../lib/slots.js'
import { subscribePresets, colorHex } from '../lib/presets.js'
import SlotModal from '../components/SlotModal.jsx'

const TYPE_STYLE = {
  empty: 'bg-slate-800 hover:bg-slate-700',
  preset: 'bg-emerald-600 hover:bg-emerald-500',
  sample: 'bg-sky-600 hover:bg-sky-500',
}
const TYPE_LABEL = { empty: '空き', preset: 'プリセット', sample: 'サンプル' }

const TOOLTIP_W = 280

// 背景色（HEX）に対して読みやすい文字色を返す
function textColorOn(hex) {
  if (!hex) return 'text-white'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const lum = 0.299 * r + 0.587 * g + 0.114 * b
  return lum > 140 ? 'text-black' : 'text-white'
}

export default function BankGrid() {
  const { user } = useAuth()
  const [slots, setSlots] = useState({}) // slotId -> data
  const [presets, setPresets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // { bank, pad } | null
  const [tip, setTip] = useState(null) // { x, y, title, body }

  // 自分のスロットを購読
  useEffect(() => {
    if (!user) return
    setLoading(true)
    const unsub = subscribeSlots(
      user.uid,
      (map) => {
        setSlots(map)
        setLoading(false)
      },
      (e) => {
        setError(`読み込みに失敗しました：${e.message}`)
        setLoading(false)
      },
    )
    return unsub
  }, [user])

  // プリセット一覧を購読（割当の選択肢・名前・色・説明の表示用）
  useEffect(() => {
    const unsub = subscribePresets(setPresets, (e) =>
      setError(`プリセットの読み込みに失敗：${e.message}`),
    )
    return unsub
  }, [])

  const presetsById = useMemo(
    () => Object.fromEntries(presets.map((p) => [p.id, p])),
    [presets],
  )

  const filled = useMemo(
    () => Object.values(slots).filter((s) => s?.type && s.type !== 'empty').length,
    [slots],
  )

  const handleSave = async (data) => {
    const { bank, pad } = editing
    const id = slotId(bank, pad)
    // 楽観的更新
    setSlots((prev) => {
      const n = { ...prev }
      if (!data.type || data.type === 'empty') delete n[id]
      else n[id] = { bank, pad, ...data }
      return n
    })
    try {
      await setSlot(user.uid, bank, pad, data)
    } catch (e) {
      setError(`保存に失敗しました：${e.message}`)
    }
  }

  // バンクグリッド（ホバー状態に依存しないよう memo 化）
  const grid = useMemo(() => {
    return Array.from({ length: BANK_COUNT }, (_, b) => {
      const bank = b + 1
      return (
        <div key={bank} className="rounded-md border border-slate-800 bg-slate-950 p-2">
          <div className="mb-1 text-xs font-medium text-slate-400">Bank {bank}</div>
          <div className="grid grid-cols-4 gap-1">
            {Array.from({ length: PAD_COUNT }, (_, p) => {
              const pad = p + 1
              const id = slotId(bank, pad)
              const s = slots[id]
              const type = s?.type || 'empty'

              let style
              let cls = TYPE_STYLE.empty
              let label = null
              let labelCls = ''
              let title = `Bank ${bank} - Pad ${pad}`
              let body = '空き'

              if (type === 'preset') {
                const preset = presetsById[s.presetId]
                const hex = colorHex(preset?.color)
                if (hex) {
                  style = { backgroundColor: hex }
                  cls = 'hover:opacity-80'
                  labelCls = textColorOn(hex)
                } else {
                  cls = TYPE_STYLE.preset
                  labelCls = 'text-white'
                }
                label = 'P'
                title = preset?.name || '(不明なプリセット)'
                body = preset?.description || ''
              } else if (type === 'sample') {
                cls = TYPE_STYLE.sample
                title = s.sampleName || 'サンプル'
                body = s.memo || ''
              }

              return (
                <button
                  key={id}
                  onClick={() => setEditing({ bank, pad })}
                  onMouseEnter={(e) =>
                    setTip({ x: e.clientX, y: e.clientY, title, body })
                  }
                  onMouseLeave={() => setTip(null)}
                  style={style}
                  className={`flex aspect-square items-center justify-center rounded-sm text-[10px] font-bold leading-none ${cls} ${labelCls}`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )
    })
  }, [slots, presetsById])

  // ツールチップの表示位置（画面端で反転）
  const tipPos = tip
    ? {
        left:
          tip.x + 14 + TOOLTIP_W > window.innerWidth
            ? tip.x - 14 - TOOLTIP_W
            : tip.x + 14,
        top: Math.min(tip.y + 14, window.innerHeight - 80),
      }
    : null

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">バンク空き状況</h1>
          <p className="mt-1 text-sm text-slate-400">
            パッドをクリックして、プリセットやサンプルを割り当てます
          </p>
        </div>
        <div className="text-sm text-slate-300">
          使用 <span className="font-bold text-emerald-400">{filled}</span> / {SLOT_COUNT}
          （空き {SLOT_COUNT - filled}）
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-rose-600/50 bg-rose-950/40 p-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* 凡例 */}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
        {Object.keys(TYPE_LABEL).map((t) => (
          <span key={t} className="flex items-center gap-1.5">
            <span className={`inline-block h-3 w-3 rounded-sm ${TYPE_STYLE[t].split(' ')[0]}`} />
            {TYPE_LABEL[t]}
          </span>
        ))}
        <span className="text-slate-500">※プリセットは音色の色で表示（「P」付き）</span>
      </div>

      {loading ? (
        <div className="mt-6 text-slate-400">読み込み中…</div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {grid}
        </div>
      )}

      {/* 独自ツールチップ（即時表示） */}
      {tip && (
        <div
          className="pointer-events-none fixed z-50 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs shadow-xl"
          style={{ left: tipPos.left, top: tipPos.top, width: TOOLTIP_W }}
        >
          <div className="font-semibold text-slate-100">{tip.title}</div>
          {tip.body && (
            <div className="mt-0.5 whitespace-pre-wrap text-slate-400">{tip.body}</div>
          )}
        </div>
      )}

      {editing && (
        <SlotModal
          bank={editing.bank}
          pad={editing.pad}
          initial={slots[slotId(editing.bank, editing.pad)]}
          presets={presets}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
