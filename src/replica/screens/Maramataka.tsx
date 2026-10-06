/**
 * /maramataka — a real month of the Māori lunar calendar, and one night opened.
 * Mirrors app/maramataka/page.tsx, components/MonthView.tsx and DayDetail.tsx.
 * Every night on screen comes from the product's own date table (baked).
 */

import React from "react";
import { Calendar, ChevronLeft, ChevronRight, Info, Moon as MoonIcon } from "lucide-react";

import { clamp01, easeOutBack, easeOutCubic, prog } from "../../core/ease";
import product from "../data/product.generated.json";
import { DEMO } from "../demo";
import { MARA } from "../screenplays";
import { h, tr } from "../strings";
import { C, energyColours, shadow } from "../tokens";
import { Badge, Button, Card, ClickRing, Col, Cursor, EMOJI, kf, Moon, Page, pressAt, PublicPageHeader, Row, Screen, T, type ScreenProps } from "../ui";

const { days, month, energyClass } = product.maramataka;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const lead = days[0].weekday;
const picked = days.find((d) => d.date === DEMO.today.iso)!;
const pickedIndex = days.indexOf(picked);

const ACTIVITY: Record<string, { fg: string; bg: string; border: string }> = {
  "Toitoi": { fg: C.purple[600], bg: C.purple[50], border: C.purple[200] },
  "Hi ika": { fg: C.blue[600], bg: C.blue[50], border: C.blue[200] },
  "Pouraka": { fg: C.orange[600], bg: C.orange[50], border: C.orange[200] },
  "Mahi māra": { fg: C.green[600], bg: C.green[50], border: C.green[200] },
};

const colours = (level: string) => energyColours((energyClass as Record<string, string>)[level]);

const Legend: React.FC<{ mobile: boolean }> = ({ mobile }) => {
  const sw = (fam: "green" | "yellow" | "blue" | "gray") => ({ width: 16, height: 16, borderRadius: 4, background: C[fam][200], border: `2px solid ${(C[fam] as Record<number, string>)[400]}`, boxSizing: "border-box" as const });
  const dot = (c: string) => ({ width: 10, height: 10, borderRadius: 99, background: c });
  return (
    <Row gap={mobile ? 8 : 16} style={{ flexWrap: "wrap", paddingBottom: 14, marginBottom: 12, borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
      <T size={12} weight={600} color={C.mutedFg}>{h("legendEnergy")}</T>
      {([["green", "legendHigh"], ["yellow", "legendMedium"], ["blue", "legendLow"], ["gray", "legendNone"]] as const).map(([fam, key]) => (
        <Row key={key} gap={5}><div style={sw(fam)} /><T size={12}>{h(key)}</T></Row>
      ))}
      {mobile ? null : <div style={{ width: 1, height: 24, background: C.border }} />}
      {mobile ? null : <T size={12} weight={600} color={C.mutedFg}>{h("legendSpecial")}</T>}
      {mobile ? null : ([[C.gray[800], "legendNewMoon"], [C.yellow[500], "legendFullMoon"], [C.blue[500], "legendDoubleDay"]] as const).map(([c, key]) => (
        <Row key={key} gap={5}><div style={dot(c)} /><T size={12}>{h(key)}</T></Row>
      ))}
    </Row>
  );
};

const DayCell: React.FC<{ i: number; t: number; mobile: boolean; ring: number }> = ({ i, t, mobile, ring }) => {
  const d = days[i];
  const e = colours(d.energyLevel);
  // each night settles in, in calendar order; never from nothing
  const at = MARA.cascadeFrom + i * MARA.cascadeStep;
  const p = easeOutBack(prog(t, at, at + MARA.cascadeDur));
  const op = 0.3 + 0.7 * clamp01(prog(t, at, at + 0.18));
  const second = d.isDoubleDay && d.doubleDayCycleDays ? d.doubleDayCycleDays[1] : null;
  return (
    <div style={{
      height: mobile ? 78 : 96, padding: mobile ? "5px 3px" : 8, borderRadius: 10, boxSizing: "border-box", position: "relative",
      border: `1px solid ${e.border}`, background: e.bg, color: e.fg, opacity: op,
      transform: `scale(${(0.86 + 0.14 * p) * (1 + 0.05 * ring)})`,
      boxShadow: ring > 0 ? `0 0 0 ${2 * ring}px ${C.green[500]}, ${shadow.lg}` : undefined, zIndex: ring > 0 ? 2 : 1,
    }}>
      <Row justify="space-between" style={{ height: 18 }}>
        <T size={mobile ? 12 : 14} weight={ring > 0.5 ? 700 : 500} color={ring > 0.5 ? C.green[700] : e.fg} lh={1}>{d.dayOfMonth}</T>
        <Row gap={2}>
          {d.isNewMoon ? <div style={{ width: 8, height: 8, borderRadius: 9, background: C.gray[800] }} /> : null}
          {d.isFullMoon ? <div style={{ width: 8, height: 8, borderRadius: 9, background: C.yellow[500] }} /> : null}
          {d.isDoubleDay ? <div style={{ width: 8, height: 8, borderRadius: 9, background: C.blue[500] }} /> : null}
        </Row>
      </Row>
      <Row justify="center" gap={2} style={{ margin: mobile ? "3px 0" : "5px 0 4px" }}>
        <Moon day={d.cycleDay} size={second ? 12 : 16} />
        {second ? <Moon day={second} size={12} /> : null}
      </Row>
      <T size={mobile ? 9.5 : 12} weight={500} color={e.fg} lh={1.25} style={{ textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</T>
      <T size={mobile ? 9.5 : 12} color={e.fg} lh={1.25} style={{ textAlign: "center", opacity: 0.75, marginTop: mobile ? 1 : 4 }}>{d.cycleDay}/30</T>
    </div>
  );
};

const DayDialog: React.FC<{ t: number; mobile: boolean }> = ({ t, mobile }) => {
  const open = easeOutCubic(prog(t, MARA.clickAt + 0.05, MARA.clickAt + 0.05 + MARA.dialogIn)) * (1 - prog(t, MARA.closeAt, MARA.closeAt + 0.22));
  if (open <= 0) return null;
  const e = colours(picked.energyLevel);
  const row = (at: number): React.CSSProperties => {
    const p = easeOutCubic(prog(t, MARA.clickAt + at, MARA.clickAt + at + 0.35));
    return { opacity: p, transform: `translateY(${(1 - p) * 8}px)` };
  };
  const cardTitle = (label: string) => <T size={14} weight={600} style={{ marginBottom: 8 }}>{label}</T>;
  return (
    <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${0.5 * open})`, display: "flex", alignItems: mobile ? "flex-start" : "center", justifyContent: "center", paddingTop: mobile ? 14 : 0, boxSizing: "border-box", zIndex: 20 }}>
      <div style={{
        width: mobile ? 358 : 640, background: C.bg, borderRadius: 12, padding: mobile ? 16 : 22, boxSizing: "border-box", boxShadow: shadow.xl,
        opacity: open, transform: `scale(${0.95 + 0.05 * open})`,
      }}>
        <Row gap={8} style={{ marginBottom: mobile ? 8 : 12 }}>
          <span style={{ fontFamily: EMOJI, fontSize: 18 }}>🌙</span>
          <T size={18} weight={600}>{h("dayDetails")}</T>
        </Row>
        <div style={{ display: mobile ? "block" : "grid", gridTemplateColumns: "200px 1fr", gap: 22 }}>
          <Col gap={8} style={{ alignItems: "center", marginBottom: mobile ? 10 : 0 }}>
            <Moon day={picked.cycleDay} size={mobile ? 60 : 84} style={{ transform: `scale(${0.8 + 0.2 * easeOutBack(prog(t, MARA.clickAt + 0.1, MARA.clickAt + 0.6))})` }} />
            <Badge bg={C.bg} border={C.border}>{DEMO.today.label}</Badge>
            <T size={20} weight={700} color={C.green[600]} lh={1.2}>{picked.name}</T>
            <div style={{ padding: "7px 16px", borderRadius: 10, border: `1px solid ${e.border}`, background: e.bg, color: e.fg, fontWeight: 500, fontSize: 14 }}>{picked.energyLevel}</div>
            <Row gap={6} style={{ flexWrap: "wrap", justifyContent: "center" }}>
              <Badge bg={C.yellow[600]} color="#fff">{h("fullMoonBadge")}</Badge>
              <Badge bg={C.green[600]} color="#fff">{h("highProductivity")}</Badge>
            </Row>
          </Col>
          <Col gap={mobile ? 8 : 10}>
            <Card pad={mobile ? 12 : 14} style={{ borderRadius: 12, ...row(0.28) }}>
              {cardTitle(h("dailyGuidance"))}
              <T size={mobile ? 12.5 : 14} color={C.mutedFg} lh={1.55}>{picked.description}</T>
            </Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: mobile ? 8 : 10 }}>
              <Card pad={mobile ? 12 : 14} style={{ borderRadius: 12, ...row(0.42) }}>
                {cardTitle(h("traditionalActivities"))}
                <Row gap={6} style={{ flexWrap: "wrap" }}>
                  {picked.activities.map((a) => (
                    <div key={a} style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 500, color: ACTIVITY[a].fg, background: ACTIVITY[a].bg, border: `1px solid ${ACTIVITY[a].border}` }}>{a}</div>
                  ))}
                </Row>
              </Card>
              <Card pad={mobile ? 12 : 14} style={{ borderRadius: 12, ...row(0.5) }}>
                {cardTitle(h("naturalConditions"))}
                <Col gap={3}>
                  <T size={12.5} color={C.green[600]}><span style={{ fontFamily: EMOJI }}>🐟</span> {h("fishingWord")}{h("goodWord")}</T>
                  <T size={12.5} color={C.green[600]}><span style={{ fontFamily: EMOJI }}>🌱</span> {h("plantingWord")}{h("goodWord")}</T>
                </Col>
              </Card>
            </div>
            <Card pad={mobile ? 12 : 14} style={{ borderRadius: 12, ...row(0.6) }}>
              {cardTitle(h("lunarCyclePosition"))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, textAlign: "center" }}>
                <div><T size={22} weight={700} color={C.green[600]} lh={1.2}>{picked.cycleDay}/30</T><T size={12} color={C.mutedFg}>{h("dayOfCycle")}</T></div>
                <div><T size={22} weight={700} color={C.blue[600]} lh={1.2}>{picked.cycleDaysRemaining}</T><T size={12} color={C.mutedFg}>{h("daysToNew")}</T></div>
              </div>
            </Card>
          </Col>
        </div>
      </div>
    </div>
  );
};

export const Maramataka: React.FC<ScreenProps> = ({ t, mobile }) => {
  const L = mobile ? { pad: 12, gap: 4, scrollTo: 196, cellH: 78 } : { pad: 32, gap: 8, scrollTo: 222, cellH: 96 };
  const scroll = kf(t, [[MARA.scrollFrom, 0], [MARA.scrollTo, L.scrollTo]]);

  // where the picked night's cell sits in the viewport once the page has scrolled
  const W = mobile ? 390 : 1024;
  const cardPad = mobile ? 10 : 16;
  const colW = (W - 2 * L.pad - 2 * cardPad - 6 * L.gap) / 7;
  const cellXY = (index: number): [number, number] => {
    const k = index + lead;
    const gridTop = (mobile ? 72 : 72) + (mobile ? 64 : 78) + (mobile ? 52 : 58) + cardPad + (mobile ? 48 : 53) + 33;
    return [L.pad + cardPad + (k % 7) * (colW + L.gap) + colW / 2, gridTop + Math.floor(k / 7) * (L.cellH + L.gap) + L.cellH / 2 - L.scrollTo];
  };
  const [px, py] = cellXY(pickedIndex);

  // after the dialog closes the ring walks on, one night at a time
  const walked = t < MARA.walkFrom ? 0 : Math.min(MARA.walkNights, Math.floor((t - MARA.walkFrom) / MARA.walkStep) + 1);
  const ringIndex = pickedIndex + walked;
  const ringOn = clamp01(prog(t, MARA.clickAt - 0.5, MARA.clickAt - 0.2));

  const cx = kf(t, [[2.4, px + 190], [3.15, px], [8, px]]);
  const cy = kf(t, [[2.4, py + 170], [3.15, py], [8, py]]);

  return (
    <Screen w={W} h={mobile ? 540 : 576}>
      <Page scroll={scroll}>
        <PublicPageHeader mobile={mobile} lang="en" title={tr("maramataka.page.title", "en")}
          icon={<MoonIcon size={mobile ? 24 : 28} color={C.green[600]} />}
          action={mobile ? null : <Button variant="outline" h={36} px={12}><Info size={16} />{h("aboutMaramataka")}</Button>} />
        <Row justify="space-between" style={{ padding: `0 ${L.pad}px`, height: mobile ? 52 : 58 }}>
          <Row gap={mobile ? 8 : 14}>
            <Button variant="outline" h={36} px={mobile ? 8 : 12}><ChevronLeft size={16} />{mobile ? null : tr("maramataka.navigation.previous", "en")}</Button>
            <T size={mobile ? 16 : 20} weight={600}>{month.label}</T>
            <Button variant="outline" h={36} px={mobile ? 8 : 12}>{mobile ? null : tr("maramataka.navigation.next", "en")}<ChevronRight size={16} /></Button>
          </Row>
          <Badge style={{ padding: "4px 10px" }}><Calendar size={12} />{mobile ? null : tr("maramataka.calendar.badge", "en")}</Badge>
        </Row>
        <div style={{ padding: `0 ${L.pad}px 40px` }}>
          <Card pad={cardPad}>
            <Legend mobile={mobile} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: L.gap }}>
              {WEEKDAYS.map((w) => (
                <T key={w} size={12} weight={500} color={C.mutedFg} style={{ textAlign: "center", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>{w}</T>
              ))}
              {Array.from({ length: lead }, (_, i) => <div key={`pad-${i}`} />)}
              {days.map((_, i) => <DayCell key={i} i={i} t={t} mobile={mobile} ring={i === ringIndex ? ringOn : 0} />)}
            </div>
          </Card>
        </div>
      </Page>
      <ClickRing x={px} y={py} t={t} at={MARA.clickAt} />
      <DayDialog t={t} mobile={mobile} />
      <Cursor x={cx} y={cy} press={pressAt(t, MARA.clickAt)} mobile={mobile} opacity={prog(t, 2.3, 2.6) * (1 - prog(t, MARA.clickAt + 0.2, MARA.clickAt + 0.5))} />
    </Screen>
  );
};
