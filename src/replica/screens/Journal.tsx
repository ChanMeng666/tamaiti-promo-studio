/**
 * /journal — the morning reflection, filled by voice.
 *
 * The product's real sequence, compressed: the mic records, the transcript is
 * confirmed in a toast, it goes to the "Journal Filler" assistant, and the
 * assistant writes it into the Hauora fields. The recording timer on screen
 * runs to its true length, so the compression is visible rather than hidden.
 *
 * Mirrors app/journal/page.tsx, components/MorningJournal.tsx,
 * VoiceInputButton.tsx and the /journal entry in copilot-routes.config.ts.
 * The spoken text is the product's own example content for each field.
 */

import React from "react";
import { BookOpen, Calendar, Mic, Save, Send, Sparkles, Square, X } from "lucide-react";

import { easeOutBack, easeOutCubic, lerp, prog, typed } from "../../core/ease";
import product from "../data/product.generated.json";
import { DEMO } from "../demo";
import { JOURNAL } from "../screenplays";
import { h, tr } from "../strings";
import { C, shadow } from "../tokens";
import { AppHeader, Button, Card, ClickRing, Col, Cursor, kf, Page, pressAt, Row, Screen, T, type ScreenProps } from "../ui";

const FIELDS = [
  ["wairua", "intentionsWairua"], ["tinana", "intentionsTinana"], ["whanau", "intentionsWhanau"], ["hinengaro", "intentionsHinengaro"],
] as const;
const examples = product.journalExamples as Record<string, string>;
const spoken = FIELDS.map(([, key]) => examples[key]).join(" ");

const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

const Form: React.FC<{ t: number; mobile: boolean }> = ({ t, mobile }) => {
  const filled = FIELDS.filter((_, i) => t >= JOURNAL.fillFrom + i * JOURNAL.fillStep + JOURNAL.fillDur).length;
  const pct = Math.round((filled / FIELDS.length) * DEMO.journal.completeTo);
  return (
    <div style={{ padding: mobile ? "12px 12px 40px" : "22px 28px 40px" }}>
      <Row justify="space-between" style={{ marginBottom: 14 }}>
        <T size={mobile ? 20 : 24} weight={700}>{tr("journal.page.title", "en")}</T>
        <Button variant="outline" h={36} px={12} size={13.5}><BookOpen size={15} />{tr("journal.page.viewHistory", "en")}</Button>
      </Row>
      <Row gap={10} style={{ marginBottom: 14, flexWrap: "wrap" }}>
        <Row gap={8}>
          <Calendar size={18} color={C.mutedFg} />
          <div style={{ padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 8, background: C.bg, fontSize: 15 }}>{DEMO.journal.date}</div>
        </Row>
        <Row gap={8} style={{ padding: "8px 12px", background: "rgba(245,245,245,0.6)", borderRadius: 8 }}>
          <Sparkles size={15} color={C.blue[500]} />
          <T size={13.5} color={C.mutedFg}>{pct}% {tr("journal.page.complete", "en")}</T>
          <div style={{ width: 48, height: 8, borderRadius: 99, background: C.muted, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: C.blue[500] }} />
          </div>
        </Row>
        {mobile ? null : <Button h={38} style={{ marginLeft: "auto" }}><Save size={15} />{tr("journal.page.saveEntry", "en")}</Button>}
      </Row>
      <div style={{ display: "flex", borderRadius: 10, background: C.muted, padding: 4, marginBottom: 14 }}>
        {(["morning", "evening"] as const).map((k, i) => (
          <div key={k} style={{ flex: 1, textAlign: "center", padding: "10px 12px", borderRadius: 8, fontSize: mobile ? 13.5 : 15, fontWeight: i === 0 ? 500 : 400, background: i === 0 ? C.bg : "transparent", color: i === 0 ? C.fg : C.mutedFg, boxShadow: i === 0 ? shadow.sm : undefined }}>
            {tr(`journal.types.${k}`, "en")}
          </div>
        ))}
      </div>
      <Card pad={mobile ? 14 : 22} style={{ boxShadow: shadow.lg }}>
        <Row justify="space-between" style={{ marginBottom: 14 }}>
          <div>
            <T size={mobile ? 18 : 20} weight={600} lh={1.2}>{tr("journal.types.morning", "en")}</T>
            <T size={13} color={C.mutedFg} style={{ marginTop: 3 }}>{tr("journal.types.morningTitle", "en")}</T>
          </div>
          <Row gap={6}><Sparkles size={15} color={C.blue[500]} /><T size={13} color={C.mutedFg}>{tr("journal.page.aiActive", "en")}</T></Row>
        </Row>
        <div style={{ background: "rgba(239,246,255,0.5)", borderRadius: 14, padding: mobile ? 14 : 20, border: `1px solid ${C.blue[100]}`, boxShadow: shadow.sm }}>
          <div style={{ borderBottom: `1px solid ${C.blue[200]}`, paddingBottom: 10, marginBottom: 14 }}>
            <T size={mobile ? 16 : 18} weight={600}>{tr("journal.morning.intentionsTitle", "en")}</T>
            <T size={13.5} color={C.mutedFg}>{tr("journal.morning.intentionsDescription", "en")}</T>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: mobile ? 12 : 16 }}>
            {FIELDS.map(([id, key], i) => {
              const at = JOURNAL.fillFrom + i * JOURNAL.fillStep;
              const p = prog(t, at, at + JOURNAL.fillDur);
              const glow = p > 0 && p < 1;
              return (
                <div key={id}>
                  <T size={mobile ? 14.5 : 16} weight={500} style={{ marginBottom: 6 }}>
                    {tr(`journal.morning.${id}.label`, "en")} <span style={{ color: C.mutedFg, fontSize: 13.5, fontWeight: 400 }}>({tr(`journal.morning.${id}.subtitle`, "en")})</span>
                  </T>
                  <div style={{
                    minHeight: mobile ? 62 : 76, borderRadius: 8, background: C.bg, padding: "8px 12px", boxSizing: "border-box", fontSize: mobile ? 13 : 14, lineHeight: 1.5,
                    border: `1px solid ${glow ? C.blue[400] : C.border}`, boxShadow: glow ? `0 0 0 3px ${C.blue[200]}` : shadow.xs,
                  }}>{typed(examples[key], p, 11 + i)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};

/** The floating microphone (VoiceInput.tsx): indigo ring at rest, red while recording. */
const MicButton: React.FC<{ t: number; x: number; y: number }> = ({ t, x, y }) => {
  const rec = t >= JOURNAL.micAt && t < JOURNAL.stopAt;
  const recT = lerp(0, DEMO.journal.recordSec, prog(t, JOURNAL.micAt, JOURNAL.stopAt));
  const pulse = rec ? 0.5 + 0.5 * Math.sin((t - JOURNAL.micAt) * 9) : 0;
  return (
    <div style={{ position: "absolute", left: x - 24, top: y - 24, zIndex: 30 }}>
      {rec ? <div style={{ position: "absolute", left: -8 - 6 * pulse, top: -8 - 6 * pulse, width: 64 + 12 * pulse, height: 64 + 12 * pulse, borderRadius: 99, background: `rgba(220,38,38,${0.22 - 0.12 * pulse})` }} /> : null}
      <div style={{
        position: "relative", width: 48, height: 48, borderRadius: 99, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center",
        border: `2px solid ${rec ? C.red[600] : C.indigo[600]}`, background: rec ? C.red[600] : "#fff", boxShadow: shadow.md,
        transform: `scale(${1 - 0.06 * Math.max(pressAt(t, JOURNAL.micAt), pressAt(t, JOURNAL.stopAt))})`,
      }}>
        {rec ? <Square size={18} color="#fff" fill="#fff" /> : <Mic size={22} color={C.indigo[600]} />}
      </div>
      {rec ? <div style={{ position: "absolute", right: 58, top: 13, fontSize: 15, fontWeight: 600, color: C.red[600], fontVariantNumeric: "tabular-nums", background: "#fff", padding: "2px 8px", borderRadius: 8, boxShadow: shadow.sm }}>{mmss(recT)}</div> : null}
    </div>
  );
};

const Toast: React.FC<{ t: number; right: number; bottom: number; w: number }> = ({ t, right, bottom, w }) => {
  const p = easeOutBack(prog(t, JOURNAL.toastAt, JOURNAL.toastAt + 0.35)) * (1 - prog(t, JOURNAL.sendAt + 0.5, JOURNAL.sendAt + 0.8));
  if (p <= 0) return null;
  return (
    <div style={{
      position: "absolute", right, bottom, width: w, background: "#fff", border: `1px solid ${C.gray[200]}`, borderRadius: 12, padding: 14, boxSizing: "border-box",
      boxShadow: "0 10px 25px rgba(0,0,0,0.15)", opacity: Math.min(1, p), transform: `translateY(${(1 - Math.min(1, p)) * 14}px) scale(${0.96 + 0.04 * p})`, transformOrigin: "100% 100%", zIndex: 31,
    }}>
      <Row justify="space-between" style={{ marginBottom: 6 }}>
        <T size={14} weight={600} color="#059669">✓ {h("voiceTranscribed")}</T>
        <X size={14} color={C.gray[400]} />
      </Row>
      <T size={13} color={C.gray[700]} lh={1.45} style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{spoken}</T>
      <T size={12} italic color={C.gray[500]} style={{ marginTop: 6 }}>{h("copiedHint")}</T>
    </div>
  );
};

/** The assistant panel: CopilotKit's stock sidebar with this route's title and opening line. */
const Assistant: React.FC<{ t: number; w: number; height: number; compact?: boolean }> = ({ t, w, height, compact }) => {
  const sent = easeOutCubic(prog(t, JOURNAL.sendAt, JOURNAL.sendAt + 0.3));
  return (
    <div style={{ width: w, height, background: "#fff", borderLeft: compact ? undefined : `1px solid ${C.border}`, display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
      <div style={{ height: 52, background: C.indigo[600], color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", flexShrink: 0 }}>
        <T size={15} weight={600} color="#fff">{h("journalFillerTitle")}</T>
        <X size={18} color="#fff" />
      </div>
      <Col gap={10} style={{ flex: 1, padding: 14, overflow: "hidden", justifyContent: compact ? "flex-end" : "flex-start" }}>
        {compact ? null : (
          <div style={{ alignSelf: "flex-start", maxWidth: "92%", background: C.muted, borderRadius: 14, padding: "10px 12px", fontSize: 13, lineHeight: 1.5 }}>{h("journalFillerInitial")}</div>
        )}
        <div style={{ alignSelf: "flex-end", maxWidth: "92%", background: C.indigo[600], color: "#fff", borderRadius: 14, padding: "10px 12px", fontSize: 13, lineHeight: 1.5, opacity: sent, transform: `translateY(${(1 - sent) * 12}px)` }}>
          <div style={compact ? { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" } : undefined}>{spoken}</div>
        </div>
      </Col>
      <div style={{ padding: "10px 12px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        <Row justify="space-between" style={{ height: 40, borderRadius: 20, border: `1px solid ${C.border}`, padding: "0 14px" }}>
          <T size={13} color={C.gray[400]}>…</T>
          <Send size={16} color={C.indigo[600]} />
        </Row>
      </div>
    </div>
  );
};

export const Journal: React.FC<ScreenProps> = ({ t, mobile }) => {
  const side = 316;
  const scroll = kf(t, [[JOURNAL.scrollFrom, 0], [JOURNAL.scrollTo, mobile ? 268 : 216]]);
  const mic = mobile ? { x: 350, y: 396 } : { x: 1024 - 44, y: 576 - 114 };
  // on a phone the assistant opens over the lower part of the page
  const sheet = mobile ? easeOutCubic(prog(t, JOURNAL.sendAt - 0.25, JOURNAL.sendAt + 0.1)) : 0;
  return (
    <Screen w={mobile ? 390 : 1024} h={mobile ? 540 : 576}>
      <AppHeader mobile={mobile} lang="en" active="journal" />
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <Page scroll={scroll} bg={`linear-gradient(135deg, ${C.slate[50]}, ${C.blue[50]})`}><Form t={t} mobile={mobile} /></Page>
        </div>
        {mobile ? null : <Assistant t={t} w={side} height={512} />}
        {mobile && sheet > 0 ? (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, transform: `translateY(${(1 - sheet) * 190}px)`, boxShadow: "0 -10px 30px rgba(0,0,0,0.18)", borderRadius: "16px 16px 0 0", overflow: "hidden", zIndex: 25 }}>
            <Assistant t={t} w={390} height={190} compact />
          </div>
        ) : null}
      </div>
      {mobile && sheet > 0.5 ? null : <MicButton t={t} x={mic.x} y={mic.y} />}
      <Toast t={t} right={mobile ? 16 : 24} bottom={mobile ? 140 : 150} w={mobile ? 320 : 340} />
      <ClickRing x={mic.x} y={mic.y} t={t} at={JOURNAL.micAt} />
      <ClickRing x={mic.x} y={mic.y} t={t} at={JOURNAL.stopAt} />
      <Cursor x={kf(t, [[0, mic.x - 150], [0.4, mic.x + 4]])} y={kf(t, [[0, mic.y - 110], [0.4, mic.y + 6]])}
        press={Math.max(pressAt(t, JOURNAL.micAt), pressAt(t, JOURNAL.stopAt))} mobile={mobile} opacity={1 - prog(t, JOURNAL.stopAt + 0.3, JOURNAL.stopAt + 0.6)} />
    </Screen>
  );
};
