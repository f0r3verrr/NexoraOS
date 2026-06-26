/* Dashboard wrapper - assembles the screen using sub-components from dashboard-*.jsx */

function DashboardScreen() {
  return (
    <div className="app-surface" style={{ display: "flex", height: "100%" }}>
      <Sidebar active="Дашборд" />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "var(--bg)" }}>
        <TopBar
          title="Дашборд"
          sub="что мне сейчас важно"
          right={<>
            <Button variant="ghost" size="sm" icon="bell" />
            <Button variant="secondary" size="sm" icon="moon">Тема</Button>
          </>}
        />
        <div className="ws-scroll" style={{ flex: 1, overflowY: "auto", padding: "24px 28px 28px 28px" }}>
          <DashHeader />
          <MetricsRow />
          <FrogCard />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 16, marginBottom: 16 }}>
            <TodayTasksCard />
            <ScheduleCard />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 16, marginBottom: 16 }}>
            <ActiveProjectsCard />
            <QuickNotesCard />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 16 }}>
            <RecentCard />
            <MoodCard />
            <HabitsCard />
          </div>
        </div>
      </main>
    </div>
  );
}

window.DashboardScreen = DashboardScreen;
