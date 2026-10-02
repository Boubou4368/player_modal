import GLib from "gi://GLib";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk?version=4.0";
// import { execAsync } from "ags/process";


export default function DynamicPlayer() {
    let currentCoverUrl = "";
    const titleLabel = new Gtk.Label({ label: "En attente..." });
    const artistLabel = new Gtk.Label({ label: "..." });
    const coverImage = new Gtk.Picture({
        // css_classes : ["imagebox"],
        can_shrink: true ,            // Permet à l'image d'être réduite si besoin
        // keep_aspect_ratio: false,    // true pour conserver le ratio, false pour forcer le remplissage complet
        content_fit: Gtk.ContentFit.COVER, // Équivalent direct de object-fit: cover !
    });
    // coverImage.set_can_shrink(false);
    // console.log(coverImage.get_can_shrink());
    // console.log(coverImage.get_size());

    const dummyBox = new Gtk.Box({
        widthRequest : 150,
        heightRequest : 150,    
        hexpand : false,
        vexpand : false,  
    });

    const coverOverlay = new Gtk.Overlay({
        halign: Gtk.Align.CENTER,
        css_classes : ["cover-art"], // Ton CSS avec les bords s'applique ici
        overflow: Gtk.Overflow.HIDDEN, 
    });
    coverOverlay.set_child(dummyBox);
    coverOverlay.add_overlay(coverImage);
    // const coverBox = new Gtk.Box({
    //     halign: Gtk.Align.CENTER,
    //     css_classes : ["cover-art"], // bord blue
    //     overflow: Gtk.Overflow.HIDDEN, 
    //     widthRequest : 150,
    //     heightRequest : 150,    
    //     hexpand : false,
    //     vexpand : false,  
    // });
    // coverImage.set_pixel_size(150);
    // coverBox.append(coverImage)
    let next = true


    /////////////////////////////////////////////////

    const cssProvider = new Gtk.CssProvider();
    coverOverlay.get_style_context().add_provider(
        cssProvider,
        Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
    );

    // Fonction helper pour appliquer l'image en CSS
    const updateCover = (width = 150) => {
        const cssData = `
            .cover-art {
                background-repeat: no-repeat;
                min-width: ${width}px;
                min-height: 150px;
                border-radius: 12px;
            }
        `;
        cssProvider.load_from_data(cssData,-1);
    };

    ////////////////////////////////////

    // Lancement de playerctl en mode continu
    const proc = new Gio.Subprocess({
        argv: ['/home/boubou/.config/waybar/script/media.sh'],
        flags: Gio.SubprocessFlags.STDOUT_PIPE,
    });
    proc.init(null);

    // Création d'un flux pour lire la sortie standard
    const stream = new Gio.DataInputStream({
        base_stream: proc.get_stdout_pipe(),
    });

    // Fonction récursive pour lire chaque ligne asynchrone
    const readLine = () => {
        stream.read_line_async(GLib.PRIORITY_DEFAULT, null, async (source, res) => {
            try {
                // let localPath = "";
                const [line] = source.read_line_finish_utf8(res);
                
                if (line !== null) {
                    // console.log(line)
                    const jsonObject = JSON.parse(line);
                    let title = jsonObject.title;
                    let artist = jsonObject.artist;
                    let artUrl = jsonObject.cover_url;
                    
                    titleLabel.set_label(title || "Inconnu");
                    artistLabel.set_label(artist || "");

                    if (artUrl && artUrl !== currentCoverUrl) {
                        console.log(currentCoverUrl)
                        console.log("la")
                        const rawUrl = artUrl.trim();
                        currentCoverUrl = artUrl;
                        coverImage.file = null;
                        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
                            const file = Gio.File.new_for_path("/tmp/cover");
                            coverImage.file = file;
                            if (rawUrl.startsWith("http")) {
                                // On redimensionne le conteneur de base, pas l'image !
                                dummyBox.set_size_request(150, 150);
                                coverImage.canShrink = true;
                                updateCover();
                            } else {
                                dummyBox.set_size_request(220, 150);
                                updateCover(220);
                            }
                            return GLib.SOURCE_REMOVE;
                        });
                        // if (rawUrl.startsWith("http")) {
                        //     updateCover()
                        // }else {
                        //     updateCover(220)
                        //     }
                        // GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
                        //     // const file = Gio.File.new_for_path();
                        //     // console.log(coverImage.get_can_shrink());
                        //     if (rawUrl.startsWith("http")) {
                        //         updateCover()
                        //     }else {
                        //         updateCover(220)
                        //     }
                        //     return GLib.SOURCE_REMOVE;
                        // });

                        // if (rawUrl.startsWith("http")) {
                        //     GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
                        //         coverImage.set_from_paintable(null);
                        //         coverImage.set_from_file("/tmp/cover");
                        //         updateCover()
                        //         return GLib.SOURCE_REMOVE;
                        //     });
                            // updateCover("/tmp/cover")
                            // if (next){
                            //     localPath = "/tmp/current_cover1.jpg";
                            //     next = false;
                            // } else {
                            //     localPath = "/tmp/current_cover.jpg";
                            //     next = true;
                            // }
                            // const localPath = `/tmp/cover_${Date.now()}.jpg`;
                            // try {
                            //     // On télécharge d'abord le fichier de manière asynchrone
                            //     await execAsync(`curl -s -L -o "${localPath}" "${rawUrl}"`);
                            //     // GTK charge la nouvelle image UNIQUEMENT quand le fichier est entièrement écrit
                            //     updateCover(localPath);
                            //     // coverImageWidget.set_from_file(tempPath);

                            //     // Optionnel : Nettoyage des anciennes miniatures dans /tmp
                            //     await sleep(10000)
                            //     execAsync(`bash -c "rm -f /tmp/cover_*.jpg; true"`).catch(() => {});
                            // } catch (e) {
                            //     console.error("Échec du téléchargement de la cover :", e);
                            // }
                            // GLib.spawn_command_line_sync(`curl -s -L -o ${localPath} "${rawUrl}"`);
                            // coverImage.set_from_file(localPath);
                            
                        // } else if (rawUrl.startsWith("file://")) {
                        //     // coverImage.set_from_file(rawUrl.replace("file://", ""));
                        //     const localPath = rawUrl.replace("file://","");
                        //     coverImage.set_from_paintable(null);
                        //     coverImage.set_from_file(localPath);
                        //     updateCover(220);
                        // }
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
            {coverOverlay} 
            <box halign={Gtk.Align.CENTER} class="title">{titleLabel}</box>           
            <box halign={Gtk.Align.CENTER} class="artiste">{artistLabel}</box>
        </box>
    );
}