"use client";
import { useState } from "react";
import s from "./summit.module.css";

/** "The conversation" cards. On phones each card folds open on tap; on larger screens the text always shows. */
export function ThemeCards({ themes }: { themes: { title: string; text: string }[] }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  return (
    <div className={s.cards}>
      {themes.map((t, k) => (
        <div key={k} className={`${s.tcard} ${open[k] ? s.open : ""}`}>
          <span className={s.cardN}>{String(k + 1).padStart(2, "0")}</span>
          <h3><button type="button" className={s.cardToggle} aria-expanded={!!open[k]} onClick={() => setOpen({ ...open, [k]: !open[k] })}><span>{t.title}</span><span className={s.plus} aria-hidden="true" /></button></h3>
          <p className={s.cardBody}>{t.text}</p>
        </div>
      ))}
    </div>
  );
}
