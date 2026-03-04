"use strict";

/**
 * help-overlay.js — Cyberpunk styled keyboard shortcut reference
 */

function createHelpOverlay(blessed, screen, state, theme) {
  const box = blessed.box({
    parent: screen,
    top: "center",
    left: "center",
    width: 72,
    height: "80%",
    border: { type: "line" },
    tags: true,
    hidden: true,
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    scrollbar: { ch: "\u2588", style: { fg: theme.accent } },
    style: {
      bg: theme.modal.bg,
      fg: theme.modal.fg,
      border: { fg: theme.accent },
    },
    label: ` {${theme.modal.titleFg}-fg}{bold}\u25C8 Keyboard Shortcuts{/} `,
  });

  const kc = theme.accentAlt; // key color (green)
  const sc = theme.accent;    // section color (purple)
  const dc = theme.modal.dimFg; // dim

  const helpText = `
 {bold}{${sc}-fg}\u25C8 NAVIGATION{/}                     {bold}{${sc}-fg}\u25C8 SEARCH{/}
  {${kc}-fg}j{/} / \u2193             Row down       {${kc}-fg}/{/}              Focus search bar
  {${kc}-fg}k{/} / \u2191             Row up         {${kc}-fg}Ctrl+f{/}         Focus search (alt)
  {${kc}-fg}Ctrl+d{/} / PgDn    Half-page down  {${kc}-fg}n{/}              Next match
  {${kc}-fg}Ctrl+u{/} / PgUp    Half-page up    {${kc}-fg}N{/} (Shift+n)    Previous match
  {${kc}-fg}g{/} / Home         First row       {${kc}-fg}Tab{/} (in search) Cycle mode
  {${kc}-fg}G{/} / End          Last row         {${dc}-fg}\u2227=AND \u2228=OR \u2261=exact \u223C=regex \u2248=fuzzy{/}
  {${kc}-fg}h{/} / \u2190            Scroll left
  {${kc}-fg}l{/} / \u2192            Scroll right   {bold}{${sc}-fg}\u25C8 ROW ACTIONS{/}
  {${kc}-fg}Tab{/}              Next tab        {${kc}-fg}Enter{/}          Toggle detail panel
  {${kc}-fg}Shift+Tab{/}        Previous tab    {${kc}-fg}b{/}              Toggle bookmark  {${theme.bookmarkFg}-fg}\u2605{/}
  {${kc}-fg}1-9{/}              Jump to tab N   {${kc}-fg}t{/}              Add tag          {${theme.tagFg}-fg}\u25CF{/}
                                     {${kc}-fg}T{/}              Remove tag
 {bold}{${sc}-fg}\u25C8 COLUMN OPERATIONS{/}               {${kc}-fg}y{/}              Copy row
  {${kc}-fg}s{/}    Sort current column
  {${kc}-fg}f{/}    Filter current column (values)
  {${kc}-fg}F{/}    Clear column filter
  {${kc}-fg}Ctrl+a{/}  Clear ALL filters

 {${dc}-fg}\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500{/}

 {bold}{${sc}-fg}\u25C8 ANALYSIS PANELS{/}                  {bold}{${sc}-fg}\u25C8 TOOLS{/}
  {${kc}-fg}H{/}    Histogram                     {${kc}-fg}c{/}    Column manager
  {${kc}-fg}S{/}    Stacking / frequency           {${kc}-fg}r{/}    Color rules
  {${kc}-fg}P{/}    Process tree                   {${kc}-fg}i{/}    IOC matcher
  {${kc}-fg}L{/}    Lateral movement               {${kc}-fg}Ctrl+e{/}  Export filtered data
  {${kc}-fg}A{/}    Persistence analysis            {${kc}-fg}Ctrl+r{/}  Generate HTML report
  {${kc}-fg}Ctrl+g{/}  Gap / burst analysis         {${kc}-fg}Ctrl+s{/}  Save session
                                     {${kc}-fg}Ctrl+o{/}  Open file
 {bold}{${sc}-fg}\u25C8 GENERAL{/}                           {${kc}-fg}?{/}       This help overlay
  {${kc}-fg}Ctrl+t{/}  Cycle theme                  {${kc}-fg}Q{/} / {${kc}-fg}Ctrl+q{/}    Quit
  {${dc}-fg}(cyberpunk \u2192 matrix \u2192 ember \u2192 light){/}   {${kc}-fg}Escape{/}        Close modal/panel

 {${dc}-fg}\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500{/}

 {bold}{${sc}-fg}\u25C8 INSIDE MODALS{/}
  {${kc}-fg}j/k{/} or {${kc}-fg}\u2191/\u2193{/}    Navigate items
  {${kc}-fg}Space{/}/{${kc}-fg}Enter{/}   Toggle / confirm
  {${kc}-fg}/{/}             Search within list
  {${kc}-fg}Tab{/}           Next field
  {${kc}-fg}Escape{/}/{${kc}-fg}q{/}     Close modal
`;

  box.setContent(helpText);

  function show() { box.show(); box.focus(); state.setModal("help"); screen.render(); }
  function hide() { box.hide(); state.closeModal(); screen.render(); }
  function toggle() { state.activeModal === "help" ? hide() : show(); }

  box.key(["escape", "?"], hide);

  return { widget: box, show, hide, toggle };
}

module.exports = { createHelpOverlay };
