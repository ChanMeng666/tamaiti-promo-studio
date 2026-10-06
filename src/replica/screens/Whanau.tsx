/**
 * Whānau support — the hub (/support), then the privacy switches for one
 * supporter (/support/network). Mirrors app/support/page.tsx and
 * app/support/network/page.tsx. Labels are the product's; the people and the
 * counts are the demo persona's.
 */

import React from "react";
import {
  ArrowLeft, Award, Calendar, CheckCircle, Heart, MessageCircle, MessageSquare, Save, Shield, Target, TrendingUp, UserPlus, Users,
} from "lucide-react";

import { clamp01, easeOutCubic, prog } from "../../core/ease";
import { DEMO } from "../demo";
import { WHANAU } from "../screenplays";
import { h, tr } from "../strings";
import { C, shadow } from "../tokens";
import { AppHeader, Avatar, Badge, Button, Card, ClickRing, Col, Cursor, kf, Page, pressAt, Row, Screen, Switch, T, type ScreenProps } from "../ui";

const s = DEMO.support;
const supporter = DEMO.supporters[0];

const Hub: React.FC<ScreenProps> = ({ t, mobile }) => {
  const pad = mobile ? 12 : 32;
  const count = (n: number) => Math.round(n * easeOutCubic(prog(t, WHANAU.statsFrom, WHANAU.statsTo)));
  const stats = [
    [Users, C.blue[500], count(s.stats.network), "supportNetwork"], [MessageCircle, C.green[500], count(s.stats.newMessages), "newMessages"],
    [Heart, C.red[500], count(s.stats.encouragements), "encouragements"], [TrendingUp, C.purple[500], count(s.stats.thisWeek), "thisWeek"],
  ] as const;
  const actions = [
    [MessageCircle, C.blue[500], C.blue[50], "messagesSupport"], [UserPlus, C.green[500], C.green[50], "inviteSupporters"], [Shield, C.purple[500], C.purple[50], "privacySettings"],
  ] as const;
  const hot = pressAt(t, WHANAU.navAt);
  return (
    <Page scroll={kf(t, [[2.5, 0], [3.3, mobile ? 232 : 60]])}>
      <div style={{ padding: `${mobile ? 14 : 24}px ${pad}px 40px` }}>
        <T size={mobile ? 20 : 30} weight={700} lh={1.2}>{tr("support.main.title", "en")}</T>
        <T size={mobile ? 13 : 16} color={C.mutedFg} style={{ marginBottom: mobile ? 12 : 18 }}>{tr("support.main.subtitle", "en")}</T>
        <Col gap={mobile ? 12 : 18}>
          <div style={{ borderRadius: 14, border: `1px solid ${C.blue[200]}`, background: C.blue[50], padding: mobile ? 14 : 18, boxShadow: shadow.sm }}>
            <Row gap={8} style={{ marginBottom: 6 }}><Users size={18} color={C.blue[900]} /><T size={mobile ? 16 : 18} weight={600} color={C.blue[900]}>{h("roopuTautoko")}</T></Row>
            <T size={mobile ? 12 : 14} color={C.blue[900]} lh={1.5}><b>{h("roopuOptional")}</b>{h("roopuPurpose")}</T>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: mobile ? 10 : 16 }}>
            {stats.map(([Icon, colour, n, key]) => (
              <Card key={key} pad={mobile ? 12 : 20}>
                <Row gap={mobile ? 8 : 12}>
                  <Icon size={mobile ? 24 : 32} color={colour} />
                  <div>
                    <T size={mobile ? 18 : 24} weight={700} lh={1.15} style={{ fontVariantNumeric: "tabular-nums" }}>{n}</T>
                    <T size={mobile ? 12 : 14} color={C.mutedFg} lh={1.3}>{tr(`support.main.stats.${key}`, "en")}</T>
                  </div>
                </Row>
              </Card>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", gap: mobile ? 10 : 18 }}>
            {actions.map(([Icon, colour, bg, key]) => {
              const on = key === "privacySettings" ? hot : 0;
              return (
                <div key={key} style={{ borderRadius: 14, background: bg, padding: mobile ? 14 : 20, boxShadow: on > 0 ? `0 0 0 ${3 * on}px ${C.purple[200]}` : shadow.sm, transform: `scale(${1 - 0.02 * on})` }}>
                  <Row gap={8} style={{ marginBottom: 6 }}><Icon size={mobile ? 20 : 24} color={colour} /><T size={mobile ? 16 : 18} weight={600}>{tr(`support.main.quickActions.${key}.title`, "en")}</T></Row>
                  <T size={mobile ? 12 : 14} color={C.mutedFg}>{tr(`support.main.quickActions.${key}.description`, "en")}</T>
                </div>
              );
            })}
          </div>
          <Card pad={mobile ? 14 : 20}>
            <Row gap={8} style={{ marginBottom: 12 }}><Calendar size={18} /><T size={mobile ? 16 : 18} weight={600}>{tr("support.main.recentActivity.title", "en")}</T></Row>
            <Col gap={8}>
              {s.activity.map((a, i) => {
                const p = easeOutCubic(prog(t, i ? WHANAU.act2At : WHANAU.act1At, (i ? WHANAU.act2At : WHANAU.act1At) + 0.35));
                return (
                  <Row key={a.who} gap={12} style={{ padding: 12, background: "rgba(245,245,245,0.5)", borderRadius: 10, opacity: 0.3 + 0.7 * p, transform: `translateX(${(1 - p) * 16}px)` }}>
                    {a.kind === "heart" ? <Heart size={16} color={C.red[500]} /> : <Target size={16} color={C.purple[500]} />}
                    <T size={mobile ? 12.5 : 14} weight={500} style={{ flex: 1 }}>{a.who} {a.what}</T>
                    <T size={12} color={C.mutedFg}>{a.ago}</T>
                    {a.isNew ? <Badge>{tr("support.main.recentActivity.newBadge", "en")}</Badge> : null}
                  </Row>
                );
              })}
            </Col>
          </Card>
        </Col>
      </div>
    </Page>
  );
};

const PERMS = [
  [Target, "viewGoals", "on"], [TrendingUp, "viewProgress", "turnsOn"], [Heart, "viewMood", "turnsOff"], [Award, "viewAchievements", "on"], [MessageSquare, "sendMessages", "on"],
] as const;

const Network: React.FC<ScreenProps & { rowY: (i: number) => number; switchX: number }> = ({ t, mobile }) => {
  const pad = mobile ? 12 : 32;
  const saved = t >= WHANAU.savedAt;
  const state = (mode: string) => mode === "on" ? 1
    : mode === "turnsOn" ? easeOutCubic(prog(t, WHANAU.toggleOnAt, WHANAU.toggleOnAt + 0.18))
    : 1 - easeOutCubic(prog(t, WHANAU.toggleOffAt, WHANAU.toggleOffAt + 0.18));
  const dirty = t >= WHANAU.toggleOnAt && !saved;
  return (
    <Page scroll={kf(t, [[WHANAU.scrollFrom, 0], [WHANAU.scrollTo, mobile ? 236 : 210]])}>
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: `${mobile ? 12 : 18}px ${pad}px`, height: mobile ? 78 : 84, boxSizing: "border-box" }}>
        <Row gap={12}>
          <ArrowLeft size={20} />
          <div>
            <T size={mobile ? 18 : 24} weight={700} lh={1.2}>{tr("support.network.title", "en")}</T>
            <T size={mobile ? 12 : 14} color={C.mutedFg}>{tr("support.network.subtitle", "en")}</T>
          </div>
        </Row>
      </div>
      <div style={{ padding: `${mobile ? 12 : 18}px ${pad}px 60px` }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: C.muted, borderRadius: 10, padding: 3, height: 38, boxSizing: "border-box", marginBottom: mobile ? 12 : 16 }}>
          {([[Shield, "privacy"], [Users, "connections"]] as const).map(([Icon, key], i) => (
            <Row key={key} gap={8} justify="center" style={{ borderRadius: 8, background: i === 0 ? C.bg : "transparent", boxShadow: i === 0 ? shadow.sm : undefined, fontSize: mobile ? 12.5 : 14, fontWeight: 500, color: i === 0 ? C.fg : C.mutedFg }}>
              <Icon size={15} />{tr(`support.network.tabs.${key}.full`, "en")}
            </Row>
          ))}
        </div>
        <div style={{ borderRadius: 14, border: `1px solid ${C.blue[200]}`, background: "rgba(239,246,255,0.3)", padding: mobile ? 14 : 18, marginBottom: mobile ? 12 : 16, height: mobile ? 178 : 124, boxSizing: "border-box" }}>
          <Row gap={8} style={{ marginBottom: 6 }}><Shield size={18} color={C.blue[800]} /><T size={mobile ? 15 : 18} weight={600} color={C.blue[800]}>{tr("support.network.privacy.noticeTitle", "en")}</T></Row>
          <T size={mobile ? 12 : 13.5} color={C.mutedFg} lh={1.5}>{tr("support.network.privacy.noticeDescription", "en")}</T>
        </div>
        <Card pad={mobile ? 14 : 20}>
          <Row justify="space-between" style={{ marginBottom: 14, height: 44 }}>
            <Row gap={12}>
              <Avatar initials={supporter.initials} size={40} />
              <div>
                <T size={mobile ? 14 : 16} weight={500} lh={1.25}>{supporter.name}</T>
                <T size={mobile ? 12 : 13.5} color={C.mutedFg} lh={1.25}>{supporter.email}</T>
              </div>
              {mobile ? null : <Badge bg={C.bg} border={C.border}>{tr("support.main.roles.whanau", "en")}</Badge>}
            </Row>
            <Button variant={saved ? "default" : "outline"} h={34} px={12} size={13.5} pressed={pressAt(t, WHANAU.saveAt)}
              style={dirty ? { borderColor: C.primary, boxShadow: `0 0 0 3px ${C.primary}22` } : undefined}>
              {saved ? <CheckCircle size={15} /> : <Save size={15} />}
              {saved ? tr("support.network.privacy.saved", "en") : tr("support.network.privacy.saveButton", "en")}
            </Button>
          </Row>
          {PERMS.map(([Icon, key, mode], i) => {
            const on = state(mode);
            const lit = (mode === "turnsOn" && t >= WHANAU.toggleOnAt - 0.3 && t < WHANAU.toggleOnAt + 0.7) || (mode === "turnsOff" && t >= WHANAU.toggleOffAt - 0.3 && t < WHANAU.toggleOffAt + 0.7);
            return (
              <div key={key} style={{ height: mobile ? 50 : 52, borderTop: i ? `1px solid ${C.border}` : undefined, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: lit ? "rgba(16,185,129,0.06)" : undefined, margin: "0 -8px", padding: "0 8px", borderRadius: lit ? 8 : 0 }}>
                <Row gap={12} style={{ minWidth: 0 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 99, background: C.muted, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={16} /></div>
                  <div style={{ minWidth: 0 }}>
                    <T size={mobile ? 13 : 14} weight={500} lh={1.3}>{tr(`support.network.privacy.permissions.${key}.label`, "en")}</T>
                    <T size={mobile ? 11 : 12} color={C.mutedFg} lh={1.3} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tr(`support.network.privacy.permissions.${key}.description`, "en")}</T>
                  </div>
                </Row>
                <Switch on={on} />
              </div>
            );
          })}
          <T size={12} color={C.mutedFg} style={{ marginTop: 10 }}>{tr("support.network.privacy.lastUpdated", "en")} {s.lastUpdated}</T>
        </Card>
      </div>
    </Page>
  );
};

export const Whanau: React.FC<ScreenProps> = ({ t, mobile }) => {
  const p = easeOutCubic(prog(t, WHANAU.cutAt, WHANAU.cutAt + WHANAU.cutDur));
  const W = mobile ? 390 : 1024;
  // viewport positions, once each page has scrolled
  const nav = mobile ? [195, 356] : [830, 388];
  const switchX = W - (mobile ? 12 : 32) - (mobile ? 14 : 20) - 16;
  const cardTop = (mobile ? 78 : 84) + (mobile ? 12 : 18) + 38 + (mobile ? 12 : 16) + (mobile ? 178 : 124) + (mobile ? 12 : 16) - (mobile ? 236 : 210);
  const rowY = (i: number) => 64 + cardTop + (mobile ? 14 : 20) + 44 + 14 + (i + 0.5) * (mobile ? 50 : 52);
  const saveXY = [W - (mobile ? 12 : 32) - (mobile ? 14 : 20) - 60, 64 + cardTop + (mobile ? 14 : 20) + 22];
  const cx = kf(t, [[3.0, nav[0] - 160], [3.55, nav[0]], [4.6, nav[0]], [5.5, switchX], [5.9, switchX], [6.5, switchX], [7.0, switchX], [7.55, saveXY[0]]]);
  const cy = kf(t, [[3.0, nav[1] + 120], [3.55, nav[1]], [4.6, nav[1]], [5.5, rowY(1)], [5.9, rowY(1)], [6.5, rowY(2)], [7.0, rowY(2)], [7.55, saveXY[1]]]);
  const press = Math.max(pressAt(t, WHANAU.navAt), pressAt(t, WHANAU.toggleOnAt), pressAt(t, WHANAU.toggleOffAt), pressAt(t, WHANAU.saveAt));
  return (
    <Screen w={W} h={mobile ? 540 : 576}>
      <AppHeader mobile={mobile} lang="en" active="support" />
      <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
        {p < 1 ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", opacity: 1 - p, transform: `translateX(${-p * 40}px)` }}><Hub t={t} mobile={mobile} /></div>
        ) : null}
        {p > 0 ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", opacity: clamp01(0.2 + p), transform: `translateX(${(1 - p) * 40}px)`, background: C.bg }}>
            <Network t={t} mobile={mobile} rowY={rowY} switchX={switchX} />
          </div>
        ) : null}
      </div>
      <ClickRing x={nav[0]} y={nav[1]} t={t} at={WHANAU.navAt} />
      <ClickRing x={switchX} y={rowY(1)} t={t} at={WHANAU.toggleOnAt} />
      <ClickRing x={switchX} y={rowY(2)} t={t} at={WHANAU.toggleOffAt} />
      <ClickRing x={saveXY[0]} y={saveXY[1]} t={t} at={WHANAU.saveAt} />
      <Cursor x={cx} y={cy} press={press} mobile={mobile} opacity={prog(t, 2.9, 3.2) * (1 - prog(t, WHANAU.savedAt + 0.2, WHANAU.savedAt + 0.5))} />
    </Screen>
  );
};
