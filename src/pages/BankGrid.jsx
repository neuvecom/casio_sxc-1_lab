// 1280スロット（80バンク × 16パッド）の空き状況ビジュアライズ。
// Firestore（users/{uid}/slots）と接続し、パッドをクリックするとモーダルで
// プリセット割当・サンプル名・メモを編集できる。
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { BANK_COUNT, PAD_COUNT, SLOT_COUNT, slotId } from '../lib/banks.js'
import { subscribeSlots, setSlot } from '../lib/slots.js'
import { subscribePresets, colorHex } from '../lib/presets.js'
import SlotModal from '../components/SlotModal.jsx'

// 背景色（HEX）に対して読みやすい文字色を返す
function textColorOn(hex) {
  if (!hex) return 'text-white'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const lum = 0.299 * r + 0.587 * g + 0.114 * b
  return lum > 140 ? 'text-black' : 'text-white'
}

const TYPE_STYLE = {
  empty: 'bg-slate-800 hover:bg-slate-700',
  preset: 'bg-emerald-600 hover:bg-emerald-500',
  sample: 'bg-sky-600 hover:bg-sky-500',
}
const TYPE_LABEL = { empty: '空き', preset: 'プリセット', sample: 'サンプル' }

export default function BankGrid() {
  const { user } = useAuth()
  const [slots, setSlots] = useState({}) // slotId -> data
  const [presets, setPresets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // { bank, pad } | null

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

  // プリセット一覧を購読（割当の選択肢・名前表示用）
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

  // パッドのツールチップ（プリセットは「名前＋説明」を改行表示）
  const slotLabel = (bank, pad, s) => {
    if (!s || !s.type || s.type === 'empty') return `Bank ${bank} - Pad ${pad}：空き`
    if (s.type === 'preset') {
      const p = presetsById[s.presetId]
      const name = p?.name || '(不明なプリセット)'
      return p?.description ? `${name}\n${p.description}` : name
    }
    const name = s.sampleName || 'サンプル'
    return s.memo ? `${name}\n${s.memo}` : name
  }

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
          {Array.from({ length: BANK_COUNT }, (_, b) => {
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

                    if (type === 'preset') {
                      const hex = colorHex(presetsById[s.presetId]?.color)
                      if (hex) {
                        style = { backgroundColor: hex }
                        cls = 'hover:opacity-80'
                        labelCls = textColorOn(hex)
                      } else {
                        cls = TYPE_STYLE.preset
                        labelCls = 'text-white'
                      }
                      label = 'P'
                    } else if (type === 'sample') {
                      cls = TYPE_STYLE.sample
                    }

                    return (
                      <button
                        key={id}
                        onClick={() => setEditing({ bank, pad })}
                        title={slotLabel(bank, pad, s)}
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
          })}
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
