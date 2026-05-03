const { useEffect, useMemo, useState } = React;

const content = window.SIGNOR_CONTENT;
const pad = (value) => String(value).padStart(3, "0");

function getPage(pageNumber) {
  return content.pages.find((page) => page.page === pageNumber);
}

function makePersonaIntro(page) {
  const [persona, ...rest] = page.items;
  return {
    ...page,
    type: "personaIntro",
    page: page.page,
    number: "024A",
    title: persona.lead,
    personaName: persona.lead,
    description: persona.body,
    items: [persona],
    paragraphs: [persona.text],
    originalPage: page.page,
  };
}

function makeLogoDirectionSlides(page) {
  const introItems = page.items.slice(0, 4);
  const directionSlides = [];

  for (let index = 4; index < page.items.length; index += 1) {
    const item = page.items[index];
    if (!item.lead?.startsWith("Subpágina")) continue;

    const directionItems = [];
    let cursor = index + 1;
    while (cursor < page.items.length && !page.items[cursor].lead?.startsWith("Subpágina")) {
      directionItems.push(page.items[cursor]);
      cursor += 1;
    }

    const title = item.lead.replace(/^Subpágina\s*\/\s*/i, "");
    directionSlides.push({
      ...page,
      type: "referenceDirection",
      page: `logo-direction-${directionSlides.length + 1}`,
      number: `${page.number}${String.fromCharCode(65 + directionSlides.length)}`,
      title,
      items: directionItems,
      paragraphs: directionItems.map((directionItem) => directionItem.text),
      referenceLabel: `Espaço para referência ${pad(directionSlides.length + 1)}`,
    });
  }

  return [
    {
      ...page,
      type: "text",
      items: introItems,
      paragraphs: introItems.map((item) => item.text),
    },
    ...directionSlides,
  ];
}

function expandPage(page) {
  if (page.page === 24) {
    const personaPage = { ...page, page: "persona-detail", number: "024B", items: page.items.slice(1), paragraphs: page.items.slice(1).map((item) => item.text) };
    return [makePersonaIntro(page), personaPage];
  }

  if (page.page === 27) {
    return [{ ...page, type: "manifestoCover", title: "Manifesto", page: "manifesto-cover", number: "027A" }, page];
  }

  if (page.page === 35) return [{ ...page, type: "comparison" }];
  if (page.page === 58) return makeLogoDirectionSlides(page);

  return [page];
}

const slides = [
  getPage(1),
  getPage(2),
  {
    type: "toc",
    theme: "dark",
    page: "toc",
    number: "SUM",
    title: "Índice do Brand Map",
    block: "Navegação",
    blockTitle: "Todas as páginas e blocos",
    toc: content.toc,
  },
  ...content.pages.filter((page) => page.page >= 3).flatMap(expandPage),
].filter(Boolean);

function readingLabel(index, total) {
  return `${pad(index + 1)} / ${pad(total)}`;
}

function extractLead(text) {
  const patterns = [
    " A Signor ",
    " Para ",
    " Na prática",
    " O documento",
    " A marca",
    " Esse ",
    " Essa ",
    " Sua ",
    " Seu ",
    " Ele ",
    " Ela ",
  ];

  const match = patterns
    .map((pattern) => text.indexOf(pattern))
    .filter((position) => position > 8 && position < 95)
    .sort((a, b) => a - b)[0];

  if (match) {
    return [text.slice(0, match).trim(), text.slice(match).trim()];
  }

  return ["", text];
}

function Shell({ slide, index, total, children, goTo }) {
  const isDark = slide.theme === "dark";

  return (
    <main className="min-h-screen bg-black text-graphite flex items-center justify-center overflow-hidden">
      <section className="deck-frame">
        <div className={`slide-surface ${isDark ? "is-dark" : "is-light"}`}>
          <div className="slide-grid">{children}</div>
          <div className="absolute bottom-[2.8%] left-[6%] z-20 text-[10px] uppercase opacity-55 page-indicator">
            {readingLabel(index, total)}
          </div>
          <div className="absolute bottom-[5%] right-[5.5%] z-20 flex items-center gap-2">
            <button className="nav-button" onClick={() => goTo(index - 1)} aria-label="Slide anterior">
              <span aria-hidden="true">‹</span>
            </button>
            <button className="nav-button" onClick={() => goTo(index + 1)} aria-label="Próximo slide">
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function SlideHeader({ slide }) {
  return (
    <div className="slide-header">
      <span>{slide.blockTitle}</span>
      <span>Signor</span>
    </div>
  );
}

function CoverSlide({ slide }) {
  return (
    <div className="col-span-12 row-span-12 flex flex-col justify-between animate-enter">
      <div className="slide-header">
        <span>Brand Strategy</span>
        <span>Signor</span>
      </div>
      <div>
        <p className="mb-8 text-[clamp(16px,2vw,30px)] uppercase opacity-70 micro-label">{slide.year}</p>
        <h1 className="font-display text-[clamp(76px,15vw,218px)] font-medium leading-[0.88] tracking-normal uppercase">
          {slide.title}
        </h1>
      </div>
      <p className="max-w-[590px] text-[clamp(15px,1.45vw,21px)] leading-relaxed text-white/72">{slide.subtitle}</p>
    </div>
  );
}

function TextSlide({ slide }) {
  const isEditorialWide = [10, 11, 17].includes(slide.page);
  const isLong = !isEditorialWide && (slide.paragraphs.join(" ").length > 1050 || slide.paragraphs.length > 4);
  const isDark = slide.theme === "dark";

  return (
    <div className={`col-span-12 row-span-12 grid grid-cols-12 gap-x-8 animate-enter text-slide ${isLong ? "is-long" : ""} ${isEditorialWide ? "is-editorial-wide" : ""}`}>
      <aside className="text-aside col-span-3 flex flex-col justify-between border-r border-current/15 pr-8">
        <div>
          <span className="font-display text-5xl font-medium leading-none">{slide.number}</span>
          <p className="mt-5 text-[10px] uppercase opacity-55 micro-label">{slide.block}</p>
        </div>
        <p className="max-w-[190px] text-[11px] uppercase leading-loose opacity-60 micro-label">{slide.blockTitle}</p>
      </aside>
      <article className="text-article col-span-7 col-start-5 self-center">
        <h2 className={`font-display font-medium uppercase leading-[0.98] ${isLong ? "text-[clamp(34px,4.5vw,66px)] mb-7" : "text-[clamp(42px,5.6vw,80px)] mb-10"}`}>{slide.title}</h2>
        <div className={`text-copy ${isDark ? "text-copy-dark" : ""} ${isLong ? "is-long" : ""}`}>
          {slide.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>
    </div>
  );
}

function BlocksSlide({ slide }) {
  const hasStructuredItems = slide.items?.some((item) => item.lead);
  const introItems = hasStructuredItems ? slide.items.filter((item) => !item.lead) : [];
  const blockItems = hasStructuredItems ? slide.items.filter((item) => item.lead) : slide.items;
  const intro = introItems.length ? introItems.map((item) => item.text).join(" ") : (!hasStructuredItems && slide.paragraphs.length > 5 ? slide.paragraphs[0] : null);
  const items = hasStructuredItems ? blockItems : slide.paragraphs.slice(intro ? 1 : 0).map((text) => ({ text, lead: "", body: text }));

  const introAsidePages = [12, 13].includes(slide.page);
  const blockClass = [
    "col-span-12 row-span-12 animate-enter blocks-slide",
    introAsidePages ? "has-intro-aside" : "",
    [12, 13, 14].includes(slide.page) ? "lower-blocks" : "",
    slide.page === 39 ? "is-vocab-avoid" : "",
    [6, 12, 13, 48, 49, 50, 57, 65, 66, 67].includes(slide.page) ? "is-compact-blocks" : "",
    [66, 67].includes(slide.page) ? "is-summary-blocks" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={blockClass}>
      <SlideHeader slide={slide} />
      <div className="blocks-heading mt-12 mb-9 flex items-start justify-between gap-8">
        <h2 className="max-w-[880px] font-display text-[clamp(40px,5.4vw,82px)] font-medium uppercase leading-[0.98]">{slide.title}</h2>
        {introAsidePages && intro && <p className="intro-aside">{intro}</p>}
        <span className="font-display text-5xl font-medium leading-none">{slide.number}</span>
      </div>
      {intro && !introAsidePages && <p className="block-intro mb-8 max-w-[860px] text-[17px] font-light leading-relaxed opacity-75">{intro}</p>}
      <div className={`content-block-grid ${items.length > 6 ? "is-dense" : ""}`}>
        {items.map((item, index) => {
          const [inferredLead, inferredBody] = extractLead(item.text);
          const lead = item.lead || inferredLead || `Ponto ${pad(index + 1)}`;
          const body = item.body || inferredBody || item.text;
          return (
            <section className="editorial-block" key={`${slide.number}-${index}`}>
              <h3 className="mb-4 font-display text-[clamp(21px,2.3vw,33px)] font-medium uppercase leading-[1.03]">{lead}</h3>
              <p className="text-[clamp(14px,1vw,16px)] font-light leading-relaxed opacity-78">{body}</p>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function PersonaIntroSlide({ slide }) {
  return (
    <div className="col-span-12 row-span-12 animate-enter persona-intro-slide">
      <SlideHeader slide={slide} />
      <div className="persona-layout">
        <div className="persona-name">
          <span>Persona estratégica</span>
          <h2>{slide.personaName}</h2>
        </div>
        <div className="persona-photo-slot">
          <span>Imagem da persona</span>
        </div>
        <p>{slide.description}</p>
      </div>
    </div>
  );
}

function ComparisonSlide({ slide }) {
  const groups = [];
  for (let index = 0; index < slide.items.length; index += 1) {
    const item = slide.items[index];
    if (!item.lead) continue;
    groups.push({
      title: item.lead.replace(/^\d+\.\s*/, ""),
      avoid: slide.items[index + 1]?.body || slide.items[index + 1]?.text || "",
      say: slide.items[index + 2]?.body || slide.items[index + 2]?.text || "",
    });
  }

  return (
    <div className="col-span-12 row-span-12 animate-enter comparison-slide">
      <SlideHeader slide={slide} />
      <div className="comparison-heading">
        <h2>{slide.title}</h2>
        <span>{slide.number}</span>
      </div>
      <div className="comparison-grid">
        {groups.map((group, index) => (
          <section className="comparison-card" key={group.title}>
            <h3>{pad(index + 1)}. {group.title}</h3>
            <div className="comparison-pair">
              <p className="avoid"><strong>Em vez de dizer</strong>{group.avoid.replace(/^Em vez de dizer:\s*/i, "")}</p>
              <p className="say"><strong>A Signor diria</strong>{group.say.replace(/^A Signor diria:\s*/i, "")}</p>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function ManifestoCoverSlide({ slide }) {
  return (
    <div className="col-span-12 row-span-12 flex flex-col justify-between animate-enter">
      <SlideHeader slide={slide} />
      <div className="self-center text-center">
        <h2 className="font-display text-[clamp(82px,14vw,210px)] font-medium uppercase leading-none">Manifesto</h2>
      </div>
      <div className="h-px w-full bg-white/16" />
    </div>
  );
}

function ManifestoSlide({ slide }) {
  return (
    <div className="col-span-12 row-span-12 flex flex-col animate-enter manifesto-page">
      <SlideHeader slide={slide} />
      <div className="manifesto-full">
        {slide.paragraphs.map((paragraph) => (
          <p className="manifesto-copy" key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}

function MoodboardTextSlide({ slide }) {
  const [activeImage, setActiveImage] = useState(null);
  const visibleItems = slide.items.slice(0, 6);

  return (
    <div className="col-span-12 row-span-12 animate-enter moodboard-text-slide">
      <SlideHeader slide={slide} />
      <div className="mt-11 mb-7 flex items-start justify-between gap-8">
        <h2 className="max-w-[820px] font-display text-[clamp(38px,5.2vw,78px)] font-medium uppercase leading-[0.98]">{slide.title}</h2>
        <span className="font-display text-5xl font-medium">{slide.number}</span>
      </div>
      <div className="moodboard-editorial">
        <div className="moodboard-copy">
          {visibleItems.map((item) => (
            <section key={item.text}>
              {item.lead && <h3>{item.lead}</h3>}
              <p>{item.body || item.text}</p>
            </section>
          ))}
        </div>
        <div className="mood-grid is-compact">
          {slide.images.map((image, index) => (
            <button className="mood-tile" key={image.src} onClick={() => setActiveImage(image)} aria-label={`Abrir ${image.label}`}>
              <img src={image.src} alt={image.label} />
              <span>{pad(index + 1)}</span>
            </button>
          ))}
        </div>
      </div>
      {activeImage && (
        <div className="image-modal" role="dialog" aria-modal="true" onClick={() => setActiveImage(null)}>
          <button className="modal-close" aria-label="Fechar imagem">×</button>
          <img src={activeImage.src} alt={activeImage.label} />
        </div>
      )}
    </div>
  );
}

function ReferenceDirectionSlide({ slide }) {
  return (
    <div className="col-span-12 row-span-12 animate-enter reference-direction-slide">
      <SlideHeader slide={slide} />
      <div className="reference-layout">
        <div className="reference-copy">
          <span>{slide.number}</span>
          <h2>{slide.title}</h2>
          <div>
            {slide.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </div>
        <div className="reference-photo-slot">
          <span>{slide.referenceLabel}</span>
        </div>
      </div>
    </div>
  );
}

function PaletteSlide({ slide }) {
  const [active, setActive] = useState(slide.colors[0]);

  return (
    <div className="col-span-12 row-span-12 animate-enter">
      <SlideHeader slide={slide} />
      <div className="mt-12 mb-10 flex items-start justify-between">
        <h2 className="font-display text-[clamp(42px,5.8vw,88px)] font-medium uppercase leading-none">{slide.title}</h2>
        <span className="font-display text-5xl font-medium">{slide.number}</span>
      </div>
      <div className="grid h-[58%] grid-cols-12 gap-5">
        <div className="col-span-8 grid grid-cols-5 gap-4">
          {slide.colors.map((color) => (
            <button
              className={`swatch ${active.hex === color.hex ? "is-active" : ""}`}
              key={color.hex}
              onClick={() => setActive(color)}
              style={{ backgroundColor: color.hex }}
              aria-label={`Selecionar ${color.name}`}
            >
              <span style={{ color: ["#1E1E22", "#2B2D31", "#5C214A"].includes(color.hex) ? "#F7F4EF" : "#1E1E22" }}>
                {color.hex}
              </span>
            </button>
          ))}
        </div>
        <aside className="col-span-4 flex flex-col justify-end border-l border-current/20 pl-8">
          <p className="mb-4 text-[10px] uppercase opacity-55 micro-label">Cor selecionada</p>
          <h3 className="font-display text-[clamp(30px,3.7vw,54px)] font-medium uppercase leading-none">{active.name}</h3>
          <p className="mt-8 text-[15px] font-light leading-relaxed opacity-78">{active.note}</p>
        </aside>
      </div>
    </div>
  );
}

function TocSlide({ slide, goToPage, pageToIndex }) {
  const entries = slide.toc.flatMap((block) => [
    { kind: "block", key: block.block, block },
    ...block.pages.map((page) => ({ kind: "page", key: `${block.block}-${page.page}`, page })),
  ]);
  const columns = [[], [], [], []];
  const maxRows = Math.ceil(entries.length / columns.length);
  entries.forEach((entry, index) => {
    columns[Math.floor(index / maxRows)].push(entry);
  });

  return (
    <div className="col-span-12 row-span-12 animate-enter">
      <div className="slide-header">
        <span>Navegação Interna</span>
        <span>Signor</span>
      </div>
      <div className="mt-10 mb-8 flex items-end justify-between">
        <h2 className="font-display text-[clamp(42px,6.3vw,94px)] font-medium uppercase leading-none">{slide.title}</h2>
        <span className="text-[11px] uppercase opacity-55 micro-label">Clique para navegar</span>
      </div>
      <div className="toc-columns">
        {columns.map((column, columnIndex) => (
          <div className="toc-column" key={columnIndex}>
            {column.map((entry) => (
              entry.kind === "block" ? (
                <button className="toc-section-row" key={entry.key} onClick={() => goToPage(entry.block.pages[0].page)}>
                  <span>{entry.block.block}</span>
                  <strong>{entry.block.title}</strong>
                </button>
              ) : (
                <button className="toc-page-row" key={entry.key} onClick={() => goToPage(entry.page.page)} disabled={!pageToIndex.has(entry.page.page)}>
                  <span>{pad(entry.page.page)}</span>
                  <em>{entry.page.title}</em>
                </button>
              )
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ClosingSlide({ slide }) {
  return (
    <div className="col-span-12 row-span-12 flex flex-col justify-between animate-enter">
      <SlideHeader slide={slide} />
      <div className="max-w-[1050px]">
        <h2 className="mb-11 font-display text-[clamp(60px,10vw,150px)] font-medium uppercase leading-none">SIGNOR</h2>
        <p className="max-w-[960px] text-[clamp(23px,3.4vw,50px)] font-light leading-[1.15] tracking-normal">
          {slide.paragraphs[slide.paragraphs.length - 1]}
        </p>
      </div>
      <span className="mb-8 h-px w-full bg-white/18" />
    </div>
  );
}

function SlideRenderer({ slide, goToPage, pageToIndex }) {
  const components = {
    cover: CoverSlide,
    text: TextSlide,
    blocks: BlocksSlide,
    personaIntro: PersonaIntroSlide,
    comparison: ComparisonSlide,
    manifestoCover: ManifestoCoverSlide,
    manifesto: ManifestoSlide,
    moodboardText: MoodboardTextSlide,
    referenceDirection: ReferenceDirectionSlide,
    palette: PaletteSlide,
    toc: TocSlide,
    closing: ClosingSlide,
  };
  const Component = components[slide.type] || TextSlide;
  return <Component slide={slide} goToPage={goToPage} pageToIndex={pageToIndex} />;
}

function App() {
  const [index, setIndex] = useState(0);
  const currentSlide = slides[index];
  const total = slides.length;

  const pageToIndex = useMemo(() => {
    const map = new Map();
    slides.forEach((slide, slideIndex) => {
      if (typeof slide.page === "number") map.set(slide.page, slideIndex);
    });
    return map;
  }, []);

  const goTo = (nextIndex) => setIndex(Math.min(Math.max(nextIndex, 0), total - 1));
  const goToPage = (page) => {
    const target = pageToIndex.get(page);
    if (target !== undefined) setIndex(target);
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "ArrowRight") goTo(index + 1);
      if (event.key === "ArrowLeft") goTo(index - 1);
      if (event.key === "Home") goTo(0);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index]);

  const slideKey = `${currentSlide.type}-${currentSlide.page}-${index}`;

  return (
    <Shell slide={currentSlide} index={index} total={total} goTo={goTo}>
      <SlideRenderer key={slideKey} slide={currentSlide} goToPage={goToPage} pageToIndex={pageToIndex} />
    </Shell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
