/**
 * Goals — first the wizard's action-plan step (/goals/new), then the savings
 * goal it creates (/goals/[id]). Mirrors GoalWizardProgress.tsx,
 * GoalActionPlanStep.tsx and components/goals/overview/SavingsOverview.tsx.
 * The seven options and their wording are the product's; the goal's name and
 * amounts are the demo persona's.
 */

import React from "react";
import { ChevronUp, Edit3, Plus, TrendingUp } from "lucide-react";

import { clamp01, easeInOutCubic, easeOutCubic, lerp, prog, typed } from "../../core/ease";
import product from "../data/product.generated.json";
import { DEMO } from "../demo";
import { GOALS } from "../screenplays";
import { h, tr, type StringKey } from "../strings";
import { C, shadow } from "../tokens";
import { AppHeader, Button, Card, ClickRing, Col, Cursor, EMOJI, kf, Page, pressAt, Row, Screen, T, type ScreenProps } from "../ui";

const OPTIONS: readonly [string, string, StringKey, StringKey][] = [
  ["a", "💰", "optA", "optADesc"], ["b", "🏦", "optB", "optBDesc"], ["c", "📈", "optC", "optCDesc"], ["d", "💳", "optD", "optDDesc"],
  ["e", "💼", "optE", "optEDesc"], ["f", "📋", "optF", "optFDesc"], ["g", "🤝", "optG", "optGDesc"],
];
const STEPS = ["goalType", "fiveYearVision", "oneYearGoal", "actionPlan", "celebration"] as const;
const goalType = product.goalTypes.find((g) => g.code === DEMO.goal.typeCode)!;
const g = DEMO.goal;

const Wizard: React.FC<ScreenProps> = ({ t, mobile }) => {
  const pad = mobile ? 16 : 112;
  const rowH = mobile ? 96 : 72;
  const scrollTo = mobile ? 250 : 196;
  const scroll = kf(t, [[GOALS.scrollFrom, 0], [GOALS.scrollTo, scrollTo]]);
  const listTop = (mobile ? 30 : 34) + 62 + (mobile ? 94 : 100) + (mobile ? 72 : 78);
  const px = mobile ? 200 : 470;
  const py = listTop + rowH + 8 + rowH / 2 - scrollTo;
  const picked = t >= GOALS.pickAt;
  return (
    <>
      <Page scroll={scroll}>
        <div style={{ padding: `${mobile ? 16 : 26}px ${pad}px 40px` }}>
          <T size={mobile ? 24 : 30} weight={700} lh={1.2}>{tr("goals.newGoal.title", "en")}</T>
          <T size={mobile ? 14 : 16} color={C.mutedFg} style={{ marginBottom: 18 }}>{tr("goals.newGoal.subtitle", "en")}</T>
          <Row justify="space-between" style={{ marginBottom: 8 }}>
            <T size={mobile ? 16 : 18} weight={500}>{h("stepWord")}4{h("ofWord")}5</T>
            <T size={14} color={C.mutedFg}>80{h("completeWord")}</T>
          </Row>
          <div style={{ height: 8, borderRadius: 99, background: C.gray[200], marginBottom: 12 }}>
            <div style={{ width: "80%", height: 8, borderRadius: 99, background: C.primary }} />
          </div>
          <Row justify="space-between" style={{ marginBottom: mobile ? 16 : 22 }}>
            {STEPS.map((key, i) => (
              <Row key={key} gap={6}>
                <div style={{
                  width: 24, height: 24, borderRadius: 99, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600,
                  border: `2px solid ${i <= 3 ? C.primary : C.gray[300]}`, background: i < 3 ? C.primary : C.bg, color: i < 3 ? "#fff" : i === 3 ? C.primary : C.gray[400],
                }}>{i < 3 ? "✓" : i + 1}</div>
                {mobile ? null : <T size={13} weight={i === 3 ? 600 : 400} color={i <= 3 ? C.fg : C.mutedFg}>{tr(`goals.newGoal.steps.${key}`, "en")}</T>}
              </Row>
            ))}
          </Row>
          <Card pad={mobile ? 16 : 22}>
            <T size={mobile ? 17 : 18} weight={600} lh={1.2}>{h("actionPlanSelection")}</T>
            <T size={14} color={C.mutedFg} style={{ margin: "6px 0 16px" }}>{h("chooseOne")}</T>
            <Col gap={8}>
              {OPTIONS.map(([id, emoji, title, desc], i) => {
                const at = GOALS.optFrom + i * GOALS.optStep;
                const p = easeOutCubic(prog(t, at, at + 0.35));
                const on = picked && id === "b";
                return (
                  <div key={id} style={{
                    display: "flex", alignItems: "flex-start", gap: 14, padding: mobile ? 12 : 14, borderRadius: 10, height: rowH, boxSizing: "border-box",
                    border: `1px solid ${on ? C.primary : C.border}`, background: on ? `${C.primary}0d` : C.bg,
                    opacity: 0.35 + 0.65 * p, transform: `translateX(${(1 - p) * 18}px)`, boxShadow: on ? `0 0 0 3px ${C.primary}22` : undefined,
                  }}>
                    <div style={{ width: 16, height: 16, borderRadius: 99, border: `1px solid ${on ? C.primary : C.gray[400]}`, marginTop: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {on ? <div style={{ width: 8, height: 8, borderRadius: 99, background: C.primary }} /> : null}
                    </div>
                    <span style={{ fontFamily: EMOJI, fontSize: 18, lineHeight: 1.3 }}>{emoji}</span>
                    <div style={{ minWidth: 0 }}>
                      <T size={mobile ? 14.5 : 16} weight={500} lh={1.3}>{h(title)}</T>
                      <T size={mobile ? 12 : 13.5} color={C.mutedFg} lh={1.45} style={mobile ? { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" } : { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h("iWantTo")}{h(desc)}</T>
                    </div>
                  </div>
                );
              })}
            </Col>
          </Card>
        </div>
      </Page>
      <ClickRing x={px} y={py} t={t} at={GOALS.pickAt} />
      <Cursor x={kf(t, [[1.9, px + 230], [2.6, px]])} y={kf(t, [[1.9, py + 190], [2.6, py]])} press={pressAt(t, GOALS.pickAt)} mobile={mobile}
        opacity={prog(t, 1.8, 2.1) * (1 - prog(t, GOALS.cutAt - 0.3, GOALS.cutAt))} />
    </>
  );
};

const Metric: React.FC<{ title: string; value: number; fam: "blue" | "green" | "amber" | "gray"; large?: boolean; icon?: React.ReactNode; pop?: number }> = ({ title, value, fam, large, icon, pop = 0 }) => {
  const f = C[fam] as Record<number, string>;
  return (
    <div style={{ borderRadius: 14, border: `2px solid ${f[200]}`, background: f[50], padding: 14, boxSizing: "border-box", transform: `scale(${1 + 0.035 * pop})` }}>
      <Row justify="space-between"><T size={13} weight={500} color={C.mutedFg}>{title}</T>{icon}</Row>
      <Row gap={2} align="baseline" style={{ marginTop: 4 }}>
        <T size={22} weight={700} color={f[500]} lh={1.1}>$</T>
        <T size={large ? 34 : 28} weight={700} color={f[500]} lh={1.1} style={{ fontVariantNumeric: "tabular-nums" }}>{Math.round(value)}</T>
      </Row>
    </div>
  );
};

const Chart: React.FC<{ grow: number; w: number; height: number }> = ({ grow, w, height }) => {
  const pts = [...g.history, g.current + g.deposit];
  const n = pts.length;
  const padX = 12, padY = 14;
  const x = (i: number) => padX + (i / (n - 1)) * (w - 2 * padX);
  const y = (v: number) => height - padY - ((v - g.baseline) / (g.target - g.baseline)) * (height - 2 * padY);
  // the line is drawn to the last recorded point, then the new saving extends it
  const lastX = lerp(x(n - 2), x(n - 1), grow);
  const lastY = lerp(y(pts[n - 2]), y(pts[n - 1]), grow);
  const d = pts.slice(0, n - 1).map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ") + ` L${lastX.toFixed(1)},${lastY.toFixed(1)}`;
  return (
    <svg width={w} height={height} style={{ display: "block" }}>
      {[0, 1, 2, 3].map((i) => <line key={i} x1={padX} x2={w - padX} y1={padY + (i * (height - 2 * padY)) / 3} y2={padY + (i * (height - 2 * padY)) / 3} stroke={C.gray[200]} strokeDasharray="3 3" />)}
      <line x1={padX} x2={w - padX} y1={y(g.target)} y2={y(g.target)} stroke={C.green[500]} strokeDasharray="6 4" strokeWidth={1.5} />
      <text x={w - padX - 4} y={y(g.target) + 15} textAnchor="end" fontSize={11} fill={C.green[600]} fontFamily="inherit">{h("target")}</text>
      <path d={`${d} L${lastX.toFixed(1)},${height - padY} L${x(0)},${height - padY} Z`} fill={`${C.blue[500]}14`} />
      <path d={d} fill="none" stroke={C.blue[500]} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {pts.slice(0, n - 1).map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={3.5} fill="#fff" stroke={C.blue[500]} strokeWidth={2} />)}
      <circle cx={lastX} cy={lastY} r={3.5 + 2.5 * grow} fill={grow > 0 ? C.blue[500] : "#fff"} stroke={C.blue[500]} strokeWidth={2} />
      {grow > 0 ? <circle cx={lastX} cy={lastY} r={6 + 12 * grow} fill="none" stroke={C.blue[500]} strokeWidth={1.5} opacity={0.5 * (1 - grow)} /> : null}
    </svg>
  );
};

const Detail: React.FC<ScreenProps> = ({ t, mobile }) => {
  const pad = mobile ? 16 : 32;
  const W = (mobile ? 390 : 1024) - 2 * pad;
  const grow = easeInOutCubic(prog(t, GOALS.growFrom, GOALS.growTo));
  const current = g.current + g.deposit * grow;
  const pop = grow > 0 && grow < 1 ? Math.sin(grow * Math.PI) : 0;
  const amount = typed(String(g.deposit) + ".00", prog(t, GOALS.typeFrom, GOALS.typeTo), 7);
  const scrollTo = mobile ? 318 : 250;
  const scroll = kf(t, [[GOALS.scroll2From, 0], [GOALS.scroll2To, scrollTo]]);
  const field: React.CSSProperties = { height: 36, borderRadius: 8, border: `1px solid ${C.border}`, boxShadow: shadow.xs, padding: "0 12px", display: "flex", alignItems: "center", fontSize: 14, boxSizing: "border-box", background: C.bg };
  const typing = t >= GOALS.typeFrom - 0.2 && t < GOALS.recordAt;
  const btn = mobile ? [195, 392] : [512, 322];
  const input = mobile ? [150, 196] : [330, 196];
  const formCols = mobile ? "1fr" : "1fr 1fr 1fr";
  return (
    <>
      <Page scroll={scroll}>
        <div style={{ padding: `${mobile ? 16 : 24}px ${pad}px 40px` }}>
          <Row justify="space-between" align="flex-start" style={{ marginBottom: 18, height: mobile ? 66 : 62 }}>
            <div style={{ minWidth: 0 }}>
              <Row gap={10}>
                <span style={{ fontFamily: EMOJI, fontSize: mobile ? 20 : 24 }}>{goalType.icon}</span>
                <T size={mobile ? 20 : 28} weight={700} lh={1.2}>{g.objective}</T>
              </Row>
              <T size={mobile ? 12 : 14} color={C.mutedFg} style={{ marginTop: 4 }}>{goalType.nameEn} • {goalType.nameMi}</T>
            </div>
            {mobile ? null : <Button variant="outline" h={36}><Edit3 size={16} />{tr("goals.detail.buttons.editGoal", "en")}</Button>}
          </Row>
          <Card pad={mobile ? 16 : 20} style={{ marginBottom: 20, height: mobile ? 336 : 262 }}>
            <Row justify="space-between" style={{ marginBottom: 16 }}>
              <Row gap={8}><Plus size={18} color={C.blue[600]} /><T size={17} weight={600}>{h("recordSavings")}</T></Row>
              <ChevronUp size={18} color={C.mutedFg} />
            </Row>
            <div style={{ display: "grid", gridTemplateColumns: formCols, gap: mobile ? 10 : 16, marginBottom: mobile ? 12 : 16 }}>
              <div>
                <T size={14} weight={500} style={{ marginBottom: 6 }}>{h("amountSaved$")}</T>
                <div style={{ ...field, borderColor: typing ? C.primary : C.border, boxShadow: typing ? `0 0 0 3px ${C.primary}33` : shadow.xs }}>
                  <span>{amount}</span>
                  {typing && Math.floor(t * 2.2) % 2 === 0 ? <span style={{ width: 1.5, height: 18, background: C.fg, marginLeft: 1 }} /> : null}
                </div>
                {mobile ? null : <T size={12} color={C.mutedFg} style={{ marginTop: 6 }}>{h("amountHelper")}</T>}
              </div>
              <div>
                <T size={14} weight={500} style={{ marginBottom: 6 }}>{h("savingsSource")}</T>
                <div style={field}>{h("sourceDeposit")}</div>
              </div>
              <div>
                <T size={14} weight={500} style={{ marginBottom: 6 }}>{h("dateLabel")}</T>
                <div style={field}>{DEMO.journal.date}</div>
              </div>
            </div>
            <Button h={40} pressed={pressAt(t, GOALS.recordAt)} style={{ width: "100%", background: C.blue[600], color: "#fff" }}>{h("recordSavings")}</Button>
          </Card>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: mobile ? 10 : 16, marginBottom: 20 }}>
            <Metric title={h("currentSavings")} value={current} fam="blue" large pop={pop} />
            <Metric title={h("target")} value={g.target} fam="gray" />
            <Metric title={h("amountSaved")} value={current - g.baseline} fam="green" icon={<TrendingUp size={16} color={C.green[600]} />} pop={pop} />
            <Metric title={h("stillToSave")} value={g.target - current} fam="amber" pop={pop} />
          </div>
          <Card pad={mobile ? 14 : 20}>
            <T size={17} weight={600} lh={1.2}>{h("growthTitle")}</T>
            <T size={13.5} color={C.mutedFg} style={{ margin: "4px 0 10px" }}>{h("growthSub")}</T>
            <Chart grow={grow} w={W - (mobile ? 30 : 42)} height={mobile ? 120 : 150} />
          </Card>
        </div>
      </Page>
      <ClickRing x={btn[0]} y={btn[1]} t={t} at={GOALS.recordAt} />
      <Cursor x={kf(t, [[5.2, input[0] + 140], [5.6, input[0]], [6.35, input[0]], [6.7, btn[0]]])} y={kf(t, [[5.2, input[1] + 120], [5.6, input[1]], [6.35, input[1]], [6.7, btn[1]]])}
        press={pressAt(t, GOALS.recordAt)} mobile={mobile} opacity={prog(t, 5.1, 5.4) * (1 - prog(t, GOALS.recordAt + 0.2, GOALS.recordAt + 0.5))} />
    </>
  );
};

export const Goals: React.FC<ScreenProps> = ({ t, mobile }) => {
  // a page navigation: the wizard hands over to the goal it made
  const p = easeOutCubic(prog(t, GOALS.cutAt, GOALS.cutAt + GOALS.cutDur));
  return (
    <Screen w={mobile ? 390 : 1024} h={mobile ? 540 : 576}>
      <AppHeader mobile={mobile} lang="en" active="goals" />
      <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
        {p < 1 ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", opacity: 1 - p, transform: `translateX(${-p * 40}px)` }}>
            <Wizard t={t} mobile={mobile} />
          </div>
        ) : null}
        {p > 0 ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", opacity: clamp01(0.2 + p), transform: `translateX(${(1 - p) * 40}px)`, background: C.bg }}>
            <Detail t={t} mobile={mobile} />
          </div>
        ) : null}
      </div>
    </Screen>
  );
};
