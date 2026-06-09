// 公開トップ（ランディング）。CASIO SXC-1 の紹介＋実機写真＋Amazonリンク。
// 未ログインでも閲覧でき、上部メニューから新規登録/ログインへ誘導する。
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

// TODO: ご自身の Amazon アソシエイトのリンクに差し替えてください（tag=◯◯-22 を含むURL）
const AMAZON_URL = "https://amzn.to/4odymiC";

const SPECS = [
  ["種別", "ポータブル・スタンドアロン・サンプラー"],
  ["サンプリング", "16bit / 48kHz（内蔵マイク・USB・3.5mm 入力）"],
  ["スロット", "80バンク × 16パッド ＝ 1280スロット（内蔵64GB）"],
  ["プリセット", "約208音。SK-1 / MT-40 由来のサウンドを使用（hip-hop 中心）"],
  ["同期", "Beat Sync（テンポに合わせてループをタイムストレッチ）"],
  ["価格・発売", "¥39,930／日本では2026年5月28日"],
];

export default function Home() {
  const { user } = useAuth();
  const [imgOk, setImgOk] = useState(true);

  return (
    <div className="space-y-12">
      {/* ヒーロー */}
      <section className="grid items-center gap-6 md:grid-cols-2">
        <div>
          <h1 className="text-3xl font-bold leading-tight">
            CASIO <span className="text-emerald-400">SXC-1</span>{" "}
            を、もっと使いこなす。
          </h1>
          <p className="mt-3 text-slate-300">
            1280スロットの中身と空きを“見える化”する管理ツール。どのバンクに何を入れたか、
            お気に入りやメモまで、ひと目で把握できます。
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {user ? (
              <>
                <Link
                  to="/banks"
                  className="rounded-md bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-500"
                >
                  バンクを見る
                </Link>
                <Link
                  to="/presets"
                  className="rounded-md border border-slate-700 px-5 py-2.5 font-medium text-slate-200 hover:bg-slate-800"
                >
                  プリセット一覧
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login?mode=register"
                  className="rounded-md bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-500"
                >
                  無料で新規登録
                </Link>
                <Link
                  to="/login"
                  className="rounded-md border border-slate-700 px-5 py-2.5 font-medium text-slate-200 hover:bg-slate-800"
                >
                  ログイン
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
          {imgOk ? (
            <img
              src="/sxc-1.jpg"
              alt="CASIO SXC-1 本体"
              className="h-full w-full object-cover"
              onError={() => setImgOk(false)}
            />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-500">
              <span className="text-sm">
                画像（public/sxc-1.jpg）を配置すると表示されます
              </span>
            </div>
          )}
        </div>
      </section>

      {/* SXC-1とは */}
      <section>
        <h2 className="text-xl font-bold">CASIO SXC-1 とは？</h2>
        <p className="mt-3 text-slate-300 leading-relaxed">
          SXC-1 は、手のひらサイズで本格的にビートメイクができる CASIO
          のポータブル・サンプラーです。
          16パッドを叩いて録音・再生し、内蔵シーケンサーやテンポ同期（Beat
          Sync）で その場でトラックを組み立てられます。往年の名機 SK-1 や MT-40
          のサウンドを使った
          プリセットも収録。サンプラーなので、自分で録った音を“素材”として育てていくのが醍醐味です。
        </p>
        <dl className="mt-5 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {SPECS.map(([k, v]) => (
            <div
              key={k}
              className="flex gap-3 border-b border-slate-800 py-2 text-sm"
            >
              <dt className="w-28 shrink-0 text-slate-400">{k}</dt>
              <dd className="text-slate-200">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs text-slate-500">
          ※仕様は公開情報に基づきます。公式が由来として挙げているのは SK-1 /
          MT-40 です。
        </p>
      </section>

      {/* Amazon */}
      <section className="rounded-xl border border-slate-800 bg-slate-950 p-5">
        <h2 className="text-lg font-bold">SXC-1 を手に入れる</h2>
        <p className="mt-2 text-sm text-slate-300">
          気になった方は、こちらからチェックできます。
        </p>
        <a
          href={AMAZON_URL}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="mt-4 inline-block rounded-md bg-amber-500 px-5 py-2.5 font-bold text-slate-900 hover:bg-amber-400"
        >
          Amazon で見る
        </a>
        <p className="mt-3 text-xs text-slate-500">
          当サイトは Amazon
          アソシエイト・プログラムの参加者です。リンク経由の購入により
          収益を得る場合があります。
        </p>
      </section>
    </div>
  );
}
