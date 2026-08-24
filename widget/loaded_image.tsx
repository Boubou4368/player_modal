import GLib from "gi://GLib";
import Gtk from "gi://Gtk?version=4.0";
import Gio from "gi://Gio";

export default function WebImage() {
    const localPath = "/tmp/current_cover.jpg";
    let music_name="";
    let artist_name="";

    try {
        // Téléchargement propre via curl
        const [ok, stdout] = GLib.spawn_command_line_sync("playerctl metadata mpris:artUrl");
        if (ok && stdout) {
            // 2. Décodage du Uint8Array en string et suppression des espaces / retours à la ligne
            const rawUrl = new TextDecoder().decode(stdout).trim();

            if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
                // Image distante -> téléchargement via curl
                GLib.spawn_command_line_sync(`curl -s -L -o ${localPath} "${rawUrl}"`);
            } else if (rawUrl.startsWith("file://")) {
                // Image déjà locale -> copie directe
                const cleanLocal = rawUrl.replace("file://", "");
                GLib.spawn_command_line_sync(`cp "${cleanLocal}" ${localPath}`);
            }
        }
    } catch (e) {
        console.error("Erreur téléchargement curl :", e);
    }
    try {
        const[ok,stdout] = GLib.spawn_command_line_sync("playerctl metadata title");
        if (ok && stdout) {
            music_name = new TextDecoder().decode(stdout).trim();
        }
    }catch (e){
        console.error("Erreur recuperation nom du morceau")
    }
    try {
        const[ok, stdout] = GLib.spawn_command_line_sync("playerctl metadata artist")
        if (ok && stdout) {
            artist_name = new TextDecoder().decode(stdout).trim()
        }
    }catch(e){
        console.error("Erreur recuperation nom de l'artiste")
    }

    return (
        <>
            <box 
                class = "image"
                css={`
                    background-image: url('file://${localPath}');
                `}
            >
            </box>
            <box class="title" halign={Gtk.Align.CENTER}>{music_name}</box>
            <box class="artiste "halign={Gtk.Align.CENTER}>{artist_name}</box>
        </>
    );
}