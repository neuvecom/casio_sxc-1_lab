// Ko-fi 支援バナー（neuvecom/kofi-banner の Web コンポーネント）
// バナーの文言や見た目を変えたら kofi-banner 側で新しいタグを打ち、ここの @vX.Y.Z を上げる
import { useEffect } from "react";

const KOFI_SCRIPT_SRC =
  "https://cdn.jsdelivr.net/gh/neuvecom/kofi-banner@v1.0.0/kofi-banner.js";

export default function KofiBanner({ user = "otasuke" }) {
  useEffect(() => {
    // スクリプトは 1 回だけ読み込む（画面遷移で作り直されても重複させない）
    if (document.querySelector(`script[src="${KOFI_SCRIPT_SRC}"]`)) return;
    const script = document.createElement("script");
    script.src = KOFI_SCRIPT_SRC;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  return (
    <kofi-banner user={user}>
      <a href={`https://ko-fi.com/${user}`} target="_blank" rel="noopener noreferrer">
        Ko-fi で制作者を支援する
      </a>
    </kofi-banner>
  );
}
