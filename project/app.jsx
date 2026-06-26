/* App entry — assembles design canvas with foundation, components, screens */

function App() {
  return (
    <DesignCanvas
      title="NexoraOS — личное рабочее пространство"
      subtitle="Дизайн-система · экраны · бренд. Тёмная тема. Desktop 1440."
    >
      {/* === FOUNDATION === */}
      <DCSection
        id="foundation"
        title="Фундамент"
        subtitle="Палитра, типографика, скругления, иконки. Тон — тёплая нейтраль с акцентом на спокойствие."
      >
        <DCArtboard id="color-tokens"   label="Поверхности и текст"  width={560} height={780}>
          <ColorTokensCard />
        </DCArtboard>
        <DCArtboard id="project-palette" label="Проектные цвета"      width={560} height={520}>
          <ProjectPaletteCard />
        </DCArtboard>
        <DCArtboard id="typography"     label="Типографика · Geist"  width={620} height={520}>
          <TypographyCard />
        </DCArtboard>
        <DCArtboard id="radii-spacing"  label="Радиусы · отступы · тени" width={620} height={540}>
          <RadiiSpacingCard />
        </DCArtboard>
        <DCArtboard id="iconography"    label="Иконографика · Lucide" width={620} height={420}>
          <IconographyCard />
        </DCArtboard>
      </DCSection>

      {/* === COMPONENTS === */}
      <DCSection
        id="components"
        title="Компоненты"
        subtitle="Атомы интерфейса — собраны из токенов выше."
      >
        <DCArtboard id="buttons"   label="Кнопки"                     width={620} height={380}>
          <ButtonsCard />
        </DCArtboard>
        <DCArtboard id="inputs"    label="Поля и поиск"               width={620} height={380}>
          <InputsCard />
        </DCArtboard>
        <DCArtboard id="badges"    label="Бейджи · теги · приоритеты" width={620} height={460}>
          <BadgesCard />
        </DCArtboard>
        <DCArtboard id="overlays"  label="Tabs · прогресс · tooltip · toast" width={620} height={460}>
          <OverlaysCard />
        </DCArtboard>
        <DCArtboard id="dropdown"  label="Dropdown · поиск ⌘K"        width={680} height={440}>
          <DropdownCard />
        </DCArtboard>
      </DCSection>

      {/* === NAV VARIANTS === */}
      <DCSection
        id="nav-variants"
        title="Навигация — 4 направления"
        subtitle="Текущая (Notion-style) — это одно из решений. Вот ещё четыре, каждое со своим характером. Готов смешать или развить любое."
      >
        <DCArtboard id="nav-v1" label="V1 · Рейка + контекстная панель (Linear / Mail)" width={640} height={900}>
          <SidebarV1 />
        </DCArtboard>
        <DCArtboard id="nav-v2" label="V2 · Карточки областей жизни"                     width={580} height={900}>
          <SidebarV2 />
        </DCArtboard>
        <DCArtboard id="nav-v3" label="V3 · Чистая рейка — всё в ⌘K"                     width={420} height={900}>
          <SidebarV3 />
        </DCArtboard>
        <DCArtboard id="nav-v4" label="V4 · Брифинг — sidebar как сводка дня"             width={560} height={900}>
          <SidebarV4 />
        </DCArtboard>
      </DCSection>

      {/* === SCREENS === */}
      <DCSection
        id="screens"
        title="Экраны"
        subtitle="Полноразмерные макеты 1440×900. Открой любую плитку на весь экран для деталей."
      >
        <DCArtboard id="dashboard" label="Дашборд — главный экран" width={1440} height={1380}>
          <DashboardScreen />
        </DCArtboard>
        <DCArtboard id="today"     label="Сегодня — фокус дня"     width={1440} height={920}>
          <TodayScreen />
        </DCArtboard>
        <DCArtboard id="inbox"     label="Inbox — захват мыслей"    width={1440} height={1100}>
          <InboxScreen />
        </DCArtboard>
        <DCArtboard id="calendar"  label="Календарь — неделя"        width={1440} height={920}>
          <CalendarScreen />
        </DCArtboard>
        <DCArtboard id="task-drawer" label="Задача · drawer над экраном" width={1440} height={920}>
          <TaskDrawerScreen />
        </DCArtboard>
        <DCArtboard id="project"   label="Проект · детальная страница (Дипломы)" width={1440} height={1240}>
          <ProjectDetailScreen />
        </DCArtboard>
      </DCSection>

      {/* === PERSONAL === */}
      <DCSection
        id="personal"
        title="Личные модули"
        subtitle="Уникальная часть — то, что вряд ли встретишь в обычных продакти-апп. Три направления: «операционное» (Машина), «тёплое» (Аня), «бытовое» (Дом)."
      >
        <DCArtboard id="car"  label="Машина — сроки, ТО, расход" width={1440} height={1100}>
          <CarModule />
        </DCArtboard>
        <DCArtboard id="girl" label="Аня — отношения" width={1440} height={1200}>
          <GirlModule />
        </DCArtboard>
        <DCArtboard id="home" label="Дом и подписки" width={1440} height={1240}>
          <HomeModule />
        </DCArtboard>
      </DCSection>

      {/* === KNOWLEDGE === */}
      <DCSection
        id="knowledge"
        title="Знания и хранилища"
        subtitle="Заметки, Дневник, Файлы — то, куда сливается всё, что нужно помнить."
      >
        <DCArtboard id="notes"   label="Заметки — три колонки + редактор" width={1440} height={1200}>
          <NotesScreen />
        </DCArtboard>
        <DCArtboard id="journal" label="Дневник — heatmap и трекинг" width={1440} height={1400}>
          <JournalScreen />
        </DCArtboard>
        <DCArtboard id="files"   label="Файлы — сетка с превью" width={1440} height={1200}>
          <FilesScreen />
        </DCArtboard>
      </DCSection>

      {/* === PLANNING === */}
      <DCSection
        id="planning"
        title="Планирование и связи"
        subtitle="CRM с детальной карточкой клиента, Гантт по проектам, Канбан-доска связанная с календарём."
      >
        <DCArtboard id="crm"     label="CRM — клиенты + детальная панель" width={1440} height={920}>
          <CrmScreen />
        </DCArtboard>
        <DCArtboard id="gantt"   label="Гантт — план на квартал" width={1440} height={760}>
          <GanttScreen />
        </DCArtboard>
        <DCArtboard id="kanban"  label="Канбан + календарь (drag-and-drop меняет срок)" width={1440} height={920}>
          <KanbanScreen />
        </DCArtboard>
      </DCSection>

      {/* === BRAND === */}
      <DCSection
        id="brand"
        title="Бренд · NexoraOS"
        subtitle="Логотип NexoraOS — 10 концепций в двух наборах. Каждый знак работает в трёх размерах (88 / 32 / 22 px) и на разных подложках."
      >
        <DCArtboard id="brand-canvas" label="Базовый набор · 4 знака" width={1280} height={900}>
          <BrandCanvas />
        </DCArtboard>
        <DCArtboard id="brand-canvas-more" label="Расширенный набор · 6 знаков" width={1700} height={900}>
          <BrandCanvasMore />
        </DCArtboard>
      </DCSection>

      {/* === MONEY & GOALS === */}
      <DCSection
        id="money-goals"
        title="Финансы и цели"
        subtitle="Денежный экран — заказы и прогноз. Цели и привычки — годовой и недельный горизонт."
      >
        <DCArtboard id="finances" label="Финансы — все источники" width={1440} height={1240}>
          <FinancesScreen />
        </DCArtboard>
        <DCArtboard id="goals"    label="Цели и привычки"           width={1440} height={1400}>
          <GoalsScreen />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
