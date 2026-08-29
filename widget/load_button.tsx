import Gio from "gi://Gio";
import GLib from "gi://GLib?version=2.0";
import Gtk from "gi://Gtk?version=4.0";
import { exec } from "ags/process";

const PATH_PAUSE = "/home/boubou/Projet/perso/player_popup/images/pause_media.svg";
const PATH_PLAY = "/home/boubou/Projet/perso/player_popup/images/test.svg";
const PATH_NEXT = "/home/boubou/Projet/perso/player_popup/images/next.svg";
const PATH_PREVIOUS = "/home/boubou/Projet/perso/player_popup/images/previous.svg";
const size_icone = 23

export default function ButtonPlayer(){
    const imageWidget = Gtk.Image.new_from_file(PATH_PLAY);
    const imageNext = Gtk.Image.new_from_file(PATH_NEXT);
    const imagePrevious = Gtk.Image.new_from_file(PATH_PREVIOUS);
    imageWidget.set_pixel_size(size_icone);
    imageNext.set_pixel_size(size_icone);
    imagePrevious.set_pixel_size(size_icone);
    let statusLabel = new Gtk.Label({label : "Paused"});
    let proc : Gio.Subprocess = launch_listener();
    proc.init(null)

    let stream : Gio.DataInputStream = launch_data(proc);
    
    const sleep = (ms: number): Promise<void> => {
        return new Promise((resolve) => setTimeout(resolve, ms));
    };
    readLine(stream, statusLabel, imageWidget);

    const togglePlay = async() => {
        try {
            GLib.spawn_command_line_sync("playerctl play-pause");
            await sleep(100)
            // readLine(stream, statusLabel, imageWidget);
        }catch (e){
            console.error("Erreur player-pause",e );
        }
    };
    
    

    return (
        <box orientation={Gtk.Orientation.HORIZONTAL} halign={Gtk.Align.CENTER} spacing={20} hexpand={true}>
            <button class="buttonPlayer fs" onClicked={() => exec("playerctl previous")}>
                {imagePrevious}
            </button>
            <button 
                class="buttonPlayer"
                onClicked={togglePlay}
            >
                {imageWidget}
            </button>
            <button class="buttonPlayer fs" onClicked={() => exec("playerctl next")}>
                {imageNext}
            </button>
        </box>
    );
}

function launch_listener() {
    //lancement du process
    const proc = new Gio.Subprocess({
        argv: ['/home/boubou/.config/waybar/script/media.sh'],
        flags: Gio.SubprocessFlags.STDOUT_PIPE,
    });
    return proc  
}

function launch_data (proc : Gio.Subprocess) {
    const stream = new Gio.DataInputStream({
        base_stream : proc.get_stdout_pipe(),
    });
    return stream
}

function readLine (stream : Gio.DataInputStream, statusLabel : Gtk.Label, imageWidget : Gtk.Image) {
    stream.read_line_async(GLib.PRIORITY_DEFAULT, null,(source,res) => {
        try {
            const [line] = source.read_line_finish_utf8(res);
            if (line !== null){
                const jsonObject = JSON.parse(line);
                let status = jsonObject.status

                statusLabel.set_label(status || "Paused");

                if (statusLabel.get_label() === "Stopped"){
                    const [ok,stdout] = GLib.spawn_command_line_sync("playerctl status");
                    if (ok && stdout) {
                        const status_stopped = new TextDecoder().decode(stdout).trim();
                        statusLabel.set_label(status_stopped);
                    }
                }

                if (statusLabel.get_label() === "Paused"){
                    imageWidget.set_from_file(PATH_PLAY)
                }
                else if (statusLabel.get_label() === "Playing"){
                    imageWidget.set_from_file(PATH_PAUSE)
                }

            }
            readLine(stream,statusLabel,imageWidget);
        }catch(e) {
            console.error("Erreur de flux: ",e)
        }
    })
}