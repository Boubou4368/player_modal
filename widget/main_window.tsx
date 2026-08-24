import Gtk from "gi://Gtk?version=4.0";
import Astal from "gi://Astal?version=4.0";
import app from "ags/gtk4/app";
import DynamicPlayer from "./load_metadata";
import ButtonPlayer from "./load_button";

export default function main_window(monitor_number: number) {
    return (
        <window 
        name={`player-popup-${monitor_number}`}
        application={app}
        visible={false} class="main" monitor={monitor_number}
        anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
        marginTop={17}
        marginRight={17}
        >
            <box orientation={Gtk.Orientation.VERTICAL}>
                <DynamicPlayer/>
                <ButtonPlayer/>
            </box>
        </window>
    )
}