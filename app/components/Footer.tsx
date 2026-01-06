export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 w-full
      bg-[var(--footer-bg)] backdrop-blur-xl
      shadow-lg border-t border-[var(--footer-border)] z-70
      text-center text-sm text-[var(--footer-text)] py-3">
      © {new Date().getFullYear()}  阿鲲 の小窝
    </footer>
  );
}
