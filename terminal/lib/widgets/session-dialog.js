"use strict";

/**
 * session-dialog.js — Modal: save/restore session
 */

const fs = require("fs");
const path = require("path");

function createSessionDialog(blessed, screen, state, theme) {
  const box = blessed.box({
    parent: screen,
    top: "center",
    left: "center",
    width: 55,
    height: 15,
    border: { type: "line" },
    tags: true,
    hidden: true,
    style: {
      bg: theme.modal.bg,
      fg: theme.modal.fg,
      border: { fg: theme.accent },
    },
    label: ` {${theme.modal.titleFg}-fg}{bold}\u25C8 Session{/} `,
  });

  const modeLabel = blessed.text({
    parent: box, top: 1, left: 2, width: "100%-4", height: 1, tags: true,
    content: "",
    style: { bg: theme.modal.bg, fg: theme.modal.fg },
  });

  const fileInput = blessed.textbox({
    parent: box, top: 3, left: 2, width: "100%-4", height: 1,
    inputOnFocus: true,
    style: { bg: theme.searchBar.inputBg, fg: theme.searchBar.inputFg, focus: { bg: theme.searchBar.inputBg } },
  });

  const statusText = blessed.text({
    parent: box, top: 5, left: 2, width: "100%-4", height: 5, tags: true,
    content: "",
    style: { bg: theme.modal.bg, fg: theme.modal.fg },
  });

  blessed.text({
    parent: box, bottom: 0, left: 2, tags: true,
    content: ` {${theme.accentAlt}-fg}Enter{/}=confirm  {${theme.accentAlt}-fg}Tab{/}=save/load  {${theme.accentAlt}-fg}Esc{/}=cancel`,
    style: { bg: theme.modal.bg, fg: theme.modal.dimFg },
  });

  let mode = "save";

  function updateMode() {
    const saveActive = mode === "save" ? `{${theme.accent}-fg}{bold}` : "";
    const loadActive = mode === "load" ? `{${theme.accent}-fg}{bold}` : "";
    modeLabel.setContent(` ${saveActive}[Save Session]${mode === "save" ? "{/}" : ""}  ${loadActive}[Load Session]${mode === "load" ? "{/}" : ""}`);
    screen.render();
  }

  function show(initialMode) {
    mode = initialMode || "save";
    updateMode();
    fileInput.setValue("session.json");
    statusText.setContent("");
    box.show();
    fileInput.focus();
    fileInput.readInput();
    state.setModal("session");
    screen.render();
  }

  function hide() {
    box.hide();
    state.closeModal();
    screen.render();
  }

  fileInput.key("tab", () => {
    mode = mode === "save" ? "load" : "save";
    updateMode();
  });

  fileInput.on("submit", (filePath) => {
    if (!filePath) return;
    filePath = filePath.trim();
    if (!path.isAbsolute(filePath)) {
      filePath = path.resolve(process.cwd(), filePath);
    }

    if (mode === "save") {
      try {
        const session = {
          version: 1,
          tabs: state.tabs.map((t) => ({
            filePath: t.filePath,
            name: t.name,
          })),
          activeTabIndex: state.activeTabIndex,
          colorRules: state.colorRules,
          tagColors: state.tagColors,
          theme: state.theme,
        };
        fs.writeFileSync(filePath, JSON.stringify(session, null, 2), "utf8");
        statusText.setContent(`{green-fg}Session saved to:\n${filePath}{/}`);
        screen.render();
        setTimeout(hide, 1500);
      } catch (err) {
        statusText.setContent(`{red-fg}Error: ${err.message}{/}`);
        screen.render();
      }
    } else {
      try {
        if (!fs.existsSync(filePath)) {
          statusText.setContent(`{red-fg}File not found: ${filePath}{/}`);
          screen.render();
          return;
        }
        const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
        statusText.setContent(
          `{green-fg}Session loaded:{/}\n` +
          `  Tabs: ${content.tabs?.length || 0}\n` +
          `  Theme: ${content.theme || "dark"}\n` +
          `  Color rules: ${content.colorRules?.length || 0}\n\n` +
          `Re-open the files listed in the session to restore.`
        );
        if (content.colorRules) state.colorRules = content.colorRules;
        if (content.tagColors) state.tagColors = content.tagColors;
        if (content.theme) state.setTheme(content.theme);
        screen.render();
        // Signal that files need to be re-imported
        state.emit("session-loaded", content);
        setTimeout(hide, 2000);
      } catch (err) {
        statusText.setContent(`{red-fg}Error: ${err.message}{/}`);
        screen.render();
      }
    }
  });

  fileInput.key("escape", hide);

  return { widget: box, show, hide };
}

module.exports = { createSessionDialog };
