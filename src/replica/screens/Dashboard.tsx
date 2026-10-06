/**
 * /dashboard — the greeting and the day's whakataukī, today's Maramataka, the
 * journal shortcuts, the morning check-in and the primary goal.
 * Mirrors app/dashboard/page.tsx and its components.
 */

import React from "react";
import { ArrowRight, Info, Moon as MoonIcon, Pencil, Plus, Sun, TrendingUp } from "lucide-react";

import { clamp01, easeOutCubic, prog } from "../../core/ease";
import product from "../data/product.generated.json";
import { DEMO } from "../demo";
import { DASH } from "../screenplays";
import { h, tr, type Lang } from "../strings";
import { C, energyColours, shadow } from "../tokens";
import {
  AppHeader, Badge, Button, Card, ClickRing, Col, Cursor, EMOJI, kf, Moon, Page, pressAt, Row, Screen, Slider, T,
  type ScreenProps,
} from "../ui";

const today = product.maramataka.days.find((d) => d.date === DEMO.today.iso)!;
const quote = product.whakatauki.seed;
const goalType = product.goalTypes.find((g) => g.code === DEMO.goal.typeCode)!;

const MOODS = [
  ["😢", "moodHoha", "moodVeryLow"], ["😔", "moodTakeo", "moodLow"], ["😐", "moodTapatahi", "moodNeutral"],
  ["😊", "moodPai", "moodGood"], ["😄", "moodWehi", "moodGreat"],
] as const;

const MaramatakaCard: React.FC<{ mobile: boolean }> = ({ mobile }) => {
  const e = energyColours(product.maramataka.energyClass[today.energyLevel as "High Energy"]);
  return (
    <Card pad={mobile ? 16 : 22} style={{ height: mobile ? 318 : 372 }}>
      <Row gap={8} style={{ marginBottom: mobile ? 12 : 16 }}>
        <MoonIcon size={16} color={C.green[600]} />
        <T size={16} weight={600} lh={1}>{h("todaysMaramataka")}</T>
      </Row>
      <div style={{ textAlign: "center", padding: "8px 12px", background: "rgba(245,245,245,0.5)", borderRadius: 10, border: `1px solid ${C.border}80`, marginBottom: mobile ? 12 : 18 }}>
        <T size={14} weight={500}>{DEMO.today.label}</T>
      </div>
      <Row gap={12} style={{ marginBottom: 12 }}>
        <Moon day={today.cycleDay} size={48} />
        <Col gap={5} style={{ minWidth: 0 }}>
          <T size={16} weight={600} color={C.green[600]} lh={1.2}>{today.name}</T>
          <div style={{ alignSelf: "flex-start", fontSize: 12, padding: "3px 8px", borderRadius: 999, color: e.fg, background: e.bg, border: `1px solid ${e.border}` }}>{today.energyLevel}</div>
        </Col>
      </Row>
      <Row gap={6} style={{ marginBottom: 12 }}>
        <Badge>{h("fullMoon")}</Badge>
        <Badge bg={C.green[600]} color="#fff">{h("highProductivity")}</Badge>
      </Row>
      <T size={mobile ? 13 : 14} color={C.mutedFg} lh={1.6} style={{ marginBottom: mobile ? 10 : 16 }}>{today.description}</T>
      {mobile ? null : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: 12, background: "rgba(245,245,245,0.3)", borderRadius: 10, border: `1px solid ${C.border}80`, marginBottom: 14 }}>
          {[["🐟", "fishing"], ["🌱", "planting"]].map(([emoji, key]) => (
            <Row key={key} gap={8}>
              <span style={{ fontFamily: EMOJI, fontSize: 16 }}>{emoji}</span>
              <T size={13.5}>{h(key as "fishing")}</T>
              <T size={13.5} weight={600} color={C.green[600]}>{h("good")}</T>
            </Row>
          ))}
        </div>
      )}
      <Row justify="space-between" style={{ paddingTop: 8, borderTop: `1px solid ${C.border}80` }}>
        <Row gap={5}>
          <T size={12} color={C.mutedFg}>{h("maramatakaDay")} {today.cycleDay}/30</T>
          <Info size={12} color={C.mutedFg} />
        </Row>
        <T size={12} color={C.mutedFg}>{today.cycleDaysRemaining} {h("daysToNewCycle")}</T>
      </Row>
    </Card>
  );
};

const JournalPanel: React.FC<{ lang: Lang; mobile: boolean }> = ({ lang, mobile }) => (
  <div style={{ background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, padding: mobile ? 14 : 22, boxSizing: "border-box" }}>
    <T size={mobile ? 16 : 19} weight={500} style={{ marginBottom: 14 }}>{tr("dashboard.journal.title", lang)}</T>
    <Col gap={10}>
      <div style={{ padding: 14, borderRadius: 10, background: `linear-gradient(135deg, rgba(239,246,255,0.8), ${C.blue[50]})`, border: "1px solid rgba(191,219,254,0.6)", borderLeft: `2px solid ${C.blue[500]}`, boxShadow: shadow.sm }}>
        <Row gap={8} style={{ marginBottom: 3 }}>
          <Sun size={19} color={C.blue[600]} />
          <T size={14.5} weight={600} color={C.blue[900]}>{tr("dashboard.journal.morning.title", lang)}</T>
        </Row>
        <T size={13} color="rgba(29,78,216,0.9)">{tr("dashboard.journal.morning.description", lang)}</T>
      </div>
      <div style={{ padding: 14, borderRadius: 10, background: "rgba(240,253,244,0.4)", border: "1px solid rgba(187,247,208,0.4)" }}>
        <Row gap={8} style={{ marginBottom: 3 }}>
          <Pencil size={18} color="rgba(22,163,74,0.8)" />
          <T size={14.5} weight={500} color="rgba(20,83,45,0.9)">{tr("dashboard.journal.morningManual.title", lang)}</T>
        </Row>
        <T size={13} color={C.mutedFg}>{tr("dashboard.journal.morningManual.description", lang)}</T>
      </div>
    </Col>
  </div>
);

const MoodCard: React.FC<{ t: number; mobile: boolean }> = ({ t, mobile }) => {
  const picked = t >= DASH.moodAt;
  const energy = kf(t, [[DASH.slideFrom, DEMO.mood.energyFrom], [DASH.slideTo, DEMO.mood.energyTo]]);
  const saved = prog(t, DASH.savedAt, DASH.savedAt + 0.3);
  return (
    <Card pad={mobile ? 16 : 22} style={{ height: mobile ? 392 : 366 }}>
      <T size={16} weight={600} lh={1.2}>{h("howAreYou")} ({h("periodAta")})</T>
      <T size={12} color={C.mutedFg} style={{ marginTop: 4, marginBottom: 14 }}>
        <span style={{ fontFamily: `${EMOJI}` }}>{h("morningEmoji").slice(0, 2)}</span>{h("morningEmoji").slice(2)}{h("checkIn")}
      </T>
      <T size={14} weight={500} style={{ marginBottom: 8 }}>{h("piropiro")}</T>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 16 }}>
        {MOODS.map(([emoji, label, sub], i) => {
          const on = picked && i === DEMO.mood.pickIndex;
          const pop = on ? 1 + 0.06 * (1 - easeOutCubic(prog(t, DASH.moodAt, DASH.moodAt + 0.3))) : 1;
          return (
            <div key={label} style={{
              padding: mobile ? "10px 2px" : 12, borderRadius: 10, textAlign: "center", boxSizing: "border-box",
              border: `2px solid ${on ? C.primary : C.border}`, background: on ? `${C.primary}1a` : C.bg, transform: `scale(${pop})`,
            }}>
              <div style={{ fontFamily: EMOJI, fontSize: 24, lineHeight: 1.2, marginBottom: 4 }}>{emoji}</div>
              <T size={mobile ? 10.5 : 12} weight={500} lh={1.25}>{h(label)}</T>
              <T size={mobile ? 10.5 : 12} color={C.mutedFg} lh={1.25}>{h(sub)}</T>
            </div>
          );
        })}
      </div>
      <T size={14} weight={500} style={{ marginBottom: 10 }}>{h("energyLevel")}</T>
      <Slider value={(energy - 1) / 4} active={t >= DASH.slideFrom - 0.1 && t <= DASH.slideTo + 0.15} />
      <Row justify="space-between" style={{ marginTop: 6, marginBottom: 14 }}>
        {[h("energyNgoikore"), h("moodLow"), h("energyOkay"), h("moodGood"), h("energyPakahukahu")].map((l, i) => (
          <T key={i} size={12} color={C.mutedFg}>{l}</T>
        ))}
      </Row>
      <div style={{ position: "relative", height: 44 }}>
        <Row justify="center" style={{ position: "absolute", inset: 0, opacity: 1 - saved }}>
          <Button h={40} style={{ width: mobile ? "100%" : 320 }} pressed={pressAt(t, DASH.saveAt)}>{h("saveWord")}{h("morning")}{h("checkIn")}</Button>
        </Row>
        <div style={{
          position: "absolute", inset: 0, opacity: saved, background: C.green[50], border: `1px solid ${C.green[200]}`, borderRadius: 8,
          display: "flex", alignItems: "center", padding: "0 12px", gap: 8, transform: `translateY(${(1 - saved) * 6}px)`,
        }}>
          <T size={14} color={C.green[600]} weight={600}>✓</T>
          <T size={13.5} color={C.green[800]}>{h("morning")} {h("checkInSaved")}</T>
        </div>
      </div>
    </Card>
  );
};

const GoalWidget: React.FC<{ mobile: boolean }> = ({ mobile }) => {
  const g = DEMO.goal;
  const pct = Math.round(((g.current - g.baseline) / (g.target - g.baseline)) * 100);
  const tile: React.CSSProperties = { background: C.bg, borderRadius: 10, padding: 12, boxShadow: shadow.sm, border: `1px solid ${C.blue[200]}` };
  return (
    <div style={{ borderRadius: 14, border: `1px solid ${C.blue[200]}`, background: `linear-gradient(135deg, ${C.blue[50]}, rgba(219,234,254,0.5))`, padding: mobile ? 16 : 20, boxSizing: "border-box", boxShadow: shadow.sm, height: mobile ? undefined : 366 }}>
      <T size={18} weight={600} lh={1.3}><span style={{ fontFamily: EMOJI }}>{goalType.icon}</span> {h("savingsGoal")}</T>
      <T size={13.5} color={C.mutedFg} style={{ marginBottom: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.objective}</T>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div style={tile}>
          <T size={12} color={C.mutedFg}>{h("current")}</T>
          <T size={24} weight={700} color={C.blue[500]} lh={1.3}>${g.current}</T>
          <T size={12} color={C.mutedFg}>of ${g.target}</T>
        </div>
        <div style={tile}>
          <T size={12} color={C.mutedFg}>{h("saved")}</T>
          <T size={24} weight={700} color={C.green[600]} lh={1.3}>+${g.current - g.baseline}</T>
          <Row gap={4}><TrendingUp size={12} color={C.blue[500]} /><T size={12} color={C.blue[500]}>{pct}{h("progressWord")}</T></Row>
        </div>
      </div>
      <div style={{ padding: 8, borderRadius: 10, background: C.blue[100], marginBottom: 14 }}>
        <T size={12} color={C.blue[800]}><span style={{ fontFamily: EMOJI }}>💪</span> {g.daysLeft}{h("daysLeftToGo")}{g.target - g.current}{h("toGo")}</T>
      </div>
      <Row gap={8}>
        <Button h={36} style={{ flex: 1, background: C.blue[500], color: "#fff" }}><Plus size={16} />{h("update")}</Button>
        <Button h={36} variant="outline" style={{ flex: 1, borderColor: C.blue[300], color: C.blue[700] }}>{h("details")}<ArrowRight size={16} /></Button>
      </Row>
    </div>
  );
};

export const Dashboard: React.FC<ScreenProps> = ({ t, mobile }) => {
  const lang: Lang = t < DASH.toggleAt ? "mi" : "en";
  // the proverb arrives word by word; the film opens on a page that is already half written
  const words = quote.textMi.split(" ");
  const shown = (i: number) => 0.18 + 0.82 * easeOutCubic(prog(t, DASH.quoteFrom + (i / words.length) * (DASH.quoteTo - DASH.quoteFrom) * 0.6, DASH.quoteFrom + (i / words.length) * (DASH.quoteTo - DASH.quoteFrom) * 0.6 + 0.4));
  const english = 0.12 + 0.88 * easeOutCubic(prog(t, DASH.quoteTo - 0.9, DASH.quoteTo));

  const L = mobile
    ? { pad: 12, scrollTo: 668, toggle: [262, 32], mood: [264, 300], s0: [201, 404], s1: [293, 404], save: [195, 462] }
    : { pad: 32, scrollTo: 440, toggle: [806, 32], mood: [462, 300], s0: [345, 414], s1: [490, 414], save: [345, 481] };
  const scroll = kf(t, [[DASH.scrollFrom, 0], [DASH.scrollTo, L.scrollTo]]);

  // the pointer's path through the beat, in viewport px
  const cx = kf(t, [[2.2, L.toggle[0] + 120], [2.85, L.toggle[0]], [3.5, L.toggle[0]], [5.2, L.mood[0]], [5.75, L.mood[0]], [6.0, L.s0[0]], [DASH.slideFrom, L.s0[0]], [DASH.slideTo, L.s1[0]], [7.2, L.s1[0]], [7.65, L.save[0]]]);
  const cy = kf(t, [[2.2, L.toggle[1] + 150], [2.85, L.toggle[1]], [3.5, L.toggle[1]], [5.2, L.mood[1]], [5.75, L.mood[1]], [6.0, L.s0[1]], [7.2, L.s1[1]], [7.65, L.save[1]]]);
  const press = Math.max(pressAt(t, DASH.toggleAt), pressAt(t, DASH.moodAt), pressAt(t, DASH.saveAt), t > DASH.slideFrom - 0.05 && t < DASH.slideTo + 0.05 ? 1 : 0);

  const header = (
    <div style={mobile ? { marginBottom: 14 } : { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 22, height: 84 }}>
      <div style={{ marginBottom: mobile ? 10 : 0 }}>
        <T size={mobile ? 20 : 24} weight={600} lh={1.3}>{tr("dashboard.header.greeting", lang)}</T>
        <T size={mobile ? 14 : 16} color={C.mutedFg}>{tr("dashboard.header.tagline", lang)}</T>
      </div>
      <Col gap={mobile ? 3 : 5}>
        <T size={mobile ? 14 : 16} weight={500} italic lh={1.4}>
          “{words.map((w, i) => <span key={i} style={{ opacity: shown(i) }}>{w}{i < words.length - 1 ? " " : ""}</span>)}”
        </T>
        <T size={mobile ? 12 : 14} color={C.mutedFg} style={{ opacity: english }}>{quote.textEn}</T>
        <T size={mobile ? 12 : 14} color={C.mutedFg} lh={1.35} style={{ opacity: english }}>{quote.meaning}</T>
      </Col>
    </div>
  );

  return (
    <Screen w={mobile ? 390 : 1024} h={mobile ? 540 : 576}>
      <AppHeader mobile={mobile} lang={lang} togglePressed={pressAt(t, DASH.toggleAt)} />
      <Page scroll={scroll}>
        <div style={{ padding: `${mobile ? 18 : 26}px ${L.pad}px 40px` }}>
          {header}
          {mobile ? (
            <Col gap={12}>
              <MaramatakaCard mobile />
              <JournalPanel lang={lang} mobile />
              <MoodCard t={t} mobile />
              <GoalWidget mobile />
            </Col>
          ) : (
            <Col gap={20}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
                <MaramatakaCard mobile={false} />
                <JournalPanel lang={lang} mobile={false} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, alignItems: "start" }}>
                <MoodCard t={t} mobile={false} />
                <GoalWidget mobile={false} />
              </div>
            </Col>
          )}
        </div>
      </Page>
      <ClickRing x={L.toggle[0]} y={L.toggle[1]} t={t} at={DASH.toggleAt} />
      <ClickRing x={L.mood[0]} y={L.mood[1]} t={t} at={DASH.moodAt} />
      <ClickRing x={L.save[0]} y={L.save[1]} t={t} at={DASH.saveAt} />
      <Cursor x={cx} y={cy} press={clamp01(press)} mobile={mobile} opacity={prog(t, 2.1, 2.4) * (1 - prog(t, 8.3, 8.7))} />
    </Screen>
  );
};
