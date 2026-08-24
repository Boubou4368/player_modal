import GLib from "gi://GLib";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk?version=4.0";

export default function DynamicPlayer() {
    const titleLabel = new Gtk.Label({ label: "En attente..." });
    const artistLabel = new Gtk.Label({ label: "..." });
    const coverImage = Gtk.Image.new();
    const coverBox = new Gtk.Box({
        halign: Gtk.Align.CENTER,
        css_classes : ["cover-art"],
    });
    coverImage.set_pixel_size(150);

    /////////////////////////////////////////////////

    const cssProvider = new Gtk.CssProvider();
    coverBox.get_style_context().add_provider(
        cssProvider,
        Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
    );

    // Fonction helper pour appliquer l'image en CSS
    const updateCover = (filePath: string) => {
        const cssData = `
            .cover-art {
                background-image: url('file://${filePath}');
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                min-width: 150px;
                min-height: 150px;
                border-radius: 12px;
            }
        `;
        cssProvider.load_from_data(cssData, -1);
    };

    ////////////////////////////////////

    // Lancement de playerctl en mode continu
    const proc = new Gio.Subprocess({
        argv: ['playerctl', 'metadata', '--format', '{{title}}|{{artist}}|{{mpris:artUrl}}', '--follow'],
        flags: Gio.SubprocessFlags.STDOUT_PIPE,
    });
    proc.init(null);

    // Création d'un flux pour lire la sortie standard
    const stream = new Gio.DataInputStream({
        base_stream: proc.get_stdout_pipe(),
    });

    // Fonction récursive pour lire chaque ligne asynchrone
    const readLine = () => {
        stream.read_line_async(GLib.PRIORITY_DEFAULT, null, (source, res) => {
            try {
                const [line] = source.read_line_finish_utf8(res);
                if (line !== null) {
                    const [title, artist, artUrl] = line.split('|');
                    
                    titleLabel.set_label(title || "Inconnu");
                    artistLabel.set_label(artist || "");

                    if (artUrl) {
                        const rawUrl = artUrl.trim();
                        if (rawUrl.startsWith("http")) {
                            const localPath = "/tmp/current_cover.jpg";
                            GLib.spawn_command_line_sync(`curl -s -L -o ${localPath} "${rawUrl}"`);
                            // coverImage.set_from_file(localPath);
                            updateCover(localPath);
                        } else if (rawUrl.startsWith("file://")) {
                            coverImage.set_from_file(rawUrl.replace("file://", ""));
                        }
                    }
                    
                    readLine();
                }
            } catch (e) {
                console.error("Erreur de flux :", e);
            }
        });
    };

    readLine(); // Initialisation de la boucle d'écoute

    return (
        <box orientation={Gtk.Orientation.VERTICAL} spacing={10}>
            {coverBox}            
            {titleLabel}
            {artistLabel}
        </box>
    );
}