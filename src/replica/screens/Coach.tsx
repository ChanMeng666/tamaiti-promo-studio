/**
 * /financial-coach — the real-time voice coach.
 * Mirrors app/(routes)/financial-coach/page.tsx and
 * components/financial-coach/ai-financial-coach.tsx.
 *
 * Only two lines of dialogue appear, and both are the product's own: the first
 * message the app sends for the user, and the greeting its coach is prompted
 * to open with. The film does not invent an AI answer.
 */

import React from "react";
import { History, Loader2, Mic, Play, Square } from "lucide-react";

import { easeOutCubic, prog, typed } from "../../core/ease";
import { DEMO } from "../demo";
import { COACH } from "../screenplays";
import { h } from "../strings";
import { C, shadow } from "../tokens";
import { AppHeader, Badge, Button, Card, ClickRing, Col, Cursor, kf, pressAt, Row, Screen, T, type ScreenProps } from "../ui";

/**
 * The idle orb, redrawn from public/animations/realtime-speaking.lottie: two
 * concentric discs in a 46-unit box, breathing on a 1.7 s loop. The keyframes
 * below are the file's own (frame at 60 fps, radius).
 */
const OUTER: readonly (readonly [number, number])[] = [[0, 21], [18, 14.5], [36, 22], [84, 22], [102, 21]];
const INNER: readonly (readonly [number, number])[] = [[0, 18], [18, 19.5], [36, 19], [84, 19], [102, 18]];
const Orb: React.FC<{ t: number; size: number }> = ({ t, size }) => {
  const f = ((t * 60) % 102 + 102) % 102;
  const k = size / 46;
  const ease = (p: number) => 1 - (1 - p) ** 3;
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" style={{ display: "block" }}>
      <circle cx={23} cy={23} r={kf(f, OUTER, ease)} fill={C.orb} opacity={0.48} />
      <circle cx={23} cy={23} r={kf(f, INNER, ease)} fill={C.orb} />
      <circle cx={23} cy={23} r={0} fill="none" strokeWidth={k} />
    </svg>
  );
};

const Bubble: React.FC<{ user: boolean; time: string; p: number; mobile: boolean; children: React.ReactNode }> = ({ user, time, p, mobile, children }) => (
  <Row justify={user ? "flex-end" : "flex-start"} style={{ opacity: p, transform: `translateY(${(1 - p) * 12}px)` }}>
    <div style={{ maxWidth: "85%", borderRadius: 10, padding: 12, background: user ? C.primary : C.muted, color: user ? C.primaryFg : C.fg }}>
      <Row gap={8} style={{ marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{user ? h("you") : h("aiCoach")}</span>
        <span style={{ fontSize: 12, opacity: 0.7 }}>{time}</span>
      </Row>
      <div style={{ fontSize: mobile ? 14 : 15, lineHeight: 1.5 }}>{children}</div>
    </div>
  </Row>
);

export const Coach: React.FC<ScreenProps> = ({ t, mobile }) => {
  const pad = mobile ? 16 : 40;
  const connecting = t >= COACH.startAt && t < COACH.connectedAt;
  const live = t >= COACH.connectedAt;
  const userP = easeOutCubic(prog(t, COACH.userAt, COACH.userAt + 0.3));
  const coachP = easeOutCubic(prog(t, COACH.coachAt, COACH.coachAt + 0.3));
  const said = typed(h("coachGreeting"), prog(t, COACH.coachAt + 0.1, COACH.coachTo), 3);
  // tailwind's animate-pulse: opacity breathing between 1 and 0.5 every two seconds
  const pulse = 0.75 + 0.25 * Math.cos(Math.PI * (t - COACH.coachTo));
  const listening = t > COACH.coachTo + 0.15;
  const start = mobile ? [100, 64 + 144] : [118, 64 + 156];
  const orbGone = prog(t, COACH.userAt - 0.25, COACH.userAt);

  return (
    <Screen w={mobile ? 390 : 1024} h={mobile ? 540 : 576}>
      <AppHeader mobile={mobile} lang="en" active="coach" />
      <div style={{ flex: 1, padding: `${mobile ? 16 : 26}px ${pad}px 0`, overflow: "hidden" }}>
        <Row justify="space-between" align="flex-start" style={{ marginBottom: mobile ? 12 : 18 }}>
          <T size={mobile ? 24 : 36} weight={700} color={C.primary} lh={1.15} style={{ maxWidth: mobile ? 250 : undefined }}>{h("coachTitle")}</T>
          <Button variant="outline" h={36} px={mobile ? 10 : 14}><History size={16} />{mobile ? null : h("viewHistory")}</Button>
        </Row>
        <Card pad={mobile ? 14 : 22}>
          <Col gap={mobile ? 12 : 16}>
            <div>
              <T size={14} weight={600} style={{ marginBottom: 10 }}>{h("sessionControl")}</T>
              <Row justify="space-between">
                <Row gap={10}>
                  {live ? (
                    <>
                      <Button variant="destructive" h={40} px={mobile ? 12 : 22}><Square size={18} />{h("endPractice")}</Button>
                      {mobile ? null : <Button variant="secondary" h={40} px={22}><Mic size={18} />{h("requestResponse")}</Button>}
                    </>
                  ) : (
                    <Button h={40} px={22} pressed={pressAt(t, COACH.startAt)} style={{ opacity: connecting ? 0.7 : 1 }}>
                      {connecting ? <Loader2 size={20} style={{ transform: `rotate(${t * 360}deg)` }} /> : <Play size={20} />}
                      {connecting ? h("connecting") : h("startPractice")}
                    </Button>
                  )}
                </Row>
                <Row gap={8}>
                  {listening ? (
                    <Badge bg={C.green[500]} color="#fff" border={C.green[600]} size={13.5} style={{ fontWeight: 600, opacity: pulse, boxShadow: "0 10px 15px -3px rgba(34,197,94,0.5)", padding: "3px 10px" }}>
                      <Mic size={14} />{h("listening")}
                    </Badge>
                  ) : null}
                  <Badge bg={live ? C.primary : C.muted} color={live ? C.primaryFg : C.fg} size={13.5} style={{ padding: "3px 10px" }}>{live ? h("connected") : h("notConnected")}</Badge>
                </Row>
              </Row>
            </div>
            <div>
              <T size={14} weight={600} style={{ marginBottom: 10 }}>{h("transcript")}</T>
              <div style={{ height: mobile ? 250 : 262, border: `1px solid ${C.border}`, borderRadius: 10, background: "rgba(245,245,245,0.2)", position: "relative", overflow: "hidden", boxShadow: `inset ${shadow.xs}` }}>
                {orbGone < 1 ? (
                  <Col gap={14} style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", opacity: 1 - orbGone }}>
                    <Orb t={t} size={mobile ? 120 : 140} />
                    <T size={14} color={C.mutedFg}>{connecting ? h("connecting") : h("startToBegin")}</T>
                  </Col>
                ) : null}
                <Col gap={16} style={{ padding: 16 }}>
                  <Bubble user time={DEMO.coach.timeUser} p={userP} mobile={mobile}>{h("coachUserFirst")}</Bubble>
                  <Bubble user={false} time={DEMO.coach.timeCoach} p={coachP} mobile={mobile}>{said}</Bubble>
                </Col>
              </div>
            </div>
          </Col>
        </Card>
      </div>
      <ClickRing x={start[0]} y={start[1]} t={t} at={COACH.startAt} />
      <Cursor x={kf(t, [[0, start[0] + 180], [0.5, start[0]]])} y={kf(t, [[0, start[1] + 130], [0.5, start[1]]])} press={pressAt(t, COACH.startAt)} mobile={mobile}
        opacity={1 - prog(t, COACH.startAt + 0.3, COACH.startAt + 0.6)} />
    </Screen>
  );
};
