import React from "react";

const Footer = () => {
  return (
    <footer className="border-t border-white/5 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-zinc-500 md:flex-row">
        <p>© 2026 Quelm. Distributed workflow orchestration platform.</p>

        <div className="flex items-center gap-6">
          <a
            href="https://github.com/SHIVAM-KUMAR-59/quelm"
            target="_blank"
            className="transition-colors hover:text-white"
          >
            Documentation
          </a>

          <a
            href="https://github.com/SHIVAM-KUMAR-59"
            target="_blank"
            className="transition-colors hover:text-white"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
