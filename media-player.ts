import app from "ags/gtk4/app"
import main_window from "./widget/main_window"

// app.apply_css("playerControllerTemplate/style/style.css")

app.start({
  css : "./style/style.css",
  instanceName: "media-player",
  main() {
    app.add_window(main_window(0));
    app.add_window(main_window(1));
  },
})