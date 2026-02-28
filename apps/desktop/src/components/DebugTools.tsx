import { invoke } from "@tauri-apps/api/core";
import { Trash2 } from "lucide-react";
import { useState } from "react";

const DebugTools = () => {
  const [clearing, setClearing] = useState(false);

  // Sadece geliştirme ortamında görünür
  if (!import.meta.env.DEV) return null;

  const handleClearCache = async () => {
    if (!confirm("Metadata cache'ini temizlemek istediğinize emin misiniz?"))
      return;

    setClearing(true);
    try {
      await invoke("clear_cache");
      alert(
        "Cache temizlendi! Oyunları yeniden tarayarak güncel verileri çekebilirsiniz.",
      );
      window.location.reload(); // Verileri tazelemek için sayfayı yenile
    } catch (error) {
      console.error("Cache temizleme hatası:", error);
      alert("Hata oluştu: " + error);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="debug-tools">
      <button
        onClick={handleClearCache}
        disabled={clearing}
        title="Clear Metadata Cache"
        className="debug-btn"
      >
        <Trash2 size={18} />
        {clearing ? "Temizleniyor..." : "Cache'i Temizle"}
      </button>
    </div>
  );
};

export default DebugTools;
